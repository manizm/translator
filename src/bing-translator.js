const fs = require('fs');
const translator = require('bing-translate-api').translate;

// Function to recursively translate JSON object
async function translateJson(json, options) {
  if (typeof json === 'string') {
    // Ignore interpolated values
    if (json.match(/\{\{.*?\}\}/g)) {
      return json;
    }

    // Translate the text
    const result = await translator(json, options.sourceLang, options.targetLang,)
    return result;
  } else if (Array.isArray(json)) {
    const newArray = [];

    for (const item of json) {
      newArray.push(await translateJson(item, options));
    }

    return newArray;
  } else if (typeof json === 'object') {
    const newObj = {};

    for (const key in json) {
      // Ignore specified paths (tags)
      if (options.ignorePaths.includes(key)) {
        newObj[key] = json[key];
      } else {
        newObj[key] = await translateJson(json[key], options);
      }
    }

    return newObj;
  } else {
    return json;
  }
}

// Function to read and translate JSON file
async function translateFile(filePath, writePath, options) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);

    const translatedData = await translateJson(jsonData, options);

    // Write the translated data back to the file
    fs.writeFileSync(writePath, JSON.stringify(translatedData, null, 2), 'utf8');

    console.log('Translation completed and saved to file.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage example

const filePath = './v1.paths.fr.json'; // Replace with your input JSON file path
const writePath = './v1.paths.en.json';
const options = {
  sourceLang: 'fr',            // Source language code
  targetLang: 'en',            // Target language code
  ignorePaths: ['tags', 'schema', 'security', 'produces']        // Paths to ignore (tags)
};

translateFile(filePath, writePath, options);
