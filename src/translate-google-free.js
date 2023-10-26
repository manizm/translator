const fs = require('fs');
const { translate } = require('@vitalets/google-translate-api');
const HttpProxyAgent = require('http-proxy-agent');

const timeoutMs = 5000;

// Function to randomly select a proxy from the list
function getRandomProxy(proxyList) {
  const randomIndex = Math.floor(Math.random() * proxyList.length);
  let p = proxyList[randomIndex]['IP Address'];
  return p;
}

// Function to recursively translate JSON object
async function translateJson(json, options, proxyList) {
  if (typeof json === 'string') {
    // Ignore interpolated values
    if (json.match(/\{\{.*?\}\}/g)) {
      return json;
    }

    // Translate the text using a random proxy
    const proxy = getRandomProxy(proxyList);
    console.log(proxy);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    const agent = HttpProxyAgent(`http://${proxy}`);
    try {
      const result = await translate(json, {
        from: options.sourceLang,
        to: options.targetLang,
        fetchOptions: {
          agent,
          timeout: 4000,
        },
      });
      clearTimeout(timer); // Cancel the timeout timer

      console.log(result);

      return result.text;
    } catch (e) {
      clearTimeout(timer); // Cancel the timeout timer

      if (e.code === 'ETIMEDOUT') {
        console.error('Translation timed out, retrying...');
        return translateJson(json, options, proxyList); // Retry translation
      } else {
        throw e; // Re-throw other errors
      }
    }
  } else if (Array.isArray(json)) {
    const newArray = [];

    for (const item of json) {
      newArray.push(await translateJson(item, options, proxyList));
    }

    return newArray;
  } else if (typeof json === 'object') {
    const newObj = {};

    for (const key in json) {
      // Ignore specified paths (tags)
      if (options.ignorePaths.includes(key)) {
        newObj[key] = json[key];
      } else {
        newObj[key] = await translateJson(json[key], options, proxyList);
      }
    }

    return newObj;
  } else {
    return json;
  }
}

// Function to read and translate JSON file
async function translateFile(filePath, writeFile, options, proxyList) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);

    const translatedData = await translateJson(jsonData, options, proxyList);

    // Write the translated data back to the file
    fs.writeFileSync(writeFile, JSON.stringify(translatedData, null, 2), 'utf8');

    console.log('Translation completed and saved to file.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage example
// Load the proxy list from a file (one proxy per line)
// const proxyList = fs.readFileSync('proxy-list.txt', 'utf8').split('\n').map(proxy => proxy.trim());

const proxyList = JSON.parse(fs.readFileSync('./utils/proxylist.json', 'utf-8')); // change path with your proxy list

const filePath = './v1.paths.fr.json'; // Replace with your input JSON file path
const writeFile = './v1.paths.en.json'; // Replace with your input JSON file path
const options = {
  sourceLang: 'fr',            // Source language code
  targetLang: 'en',            // Target language code
  ignorePaths: ['tags', 'schema', 'security', 'produces']        // Paths to ignore (tags)
};

translateFile(filePath, writeFile, options, proxyList);
