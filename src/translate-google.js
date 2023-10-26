const fs = require('fs');
const { Translate } = require('@google-cloud/translate').v2;

// TODO: Support env variables
const translate = new Translate({
  projectId: '<project-id-from-gcp>',
  key: '<your-api-key>'
});

// Global counters to keep track of progress
let totalItems = 0;
let translatedItems = 0;

// Function to recursively translate JSON object
async function translateJson(json, options) {
  if (typeof json === 'string') {
    // Ignore interpolated values
    if (json.match(/\{\{.*?\}\}/g)) {
      return json;
    }

    // Translate the text
      const result = await translate.translate(
        json, {
          from: options.sourceLang,
          to: options.targetLang
        }
      )

    translatedItems++; // Increment the translated items counter
    const remainingItems = totalItems - translatedItems;
    // console.log(`Translated ${translatedItems} items. ${remainingItems} items left.`);
    process.stdout.write(`Translated ${translatedItems} items. ${remainingItems} items left.\r`);

      return result[0];
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
async function translateFile(filePath, writeFile, options) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);

    totalItems = countItems(jsonData); // Count the total items in JSON data
    translatedItems = 0; // Reset the translated items counter

    const translatedData = await translateJson(jsonData, options);

    // Write the translated data back to the file
    fs.writeFileSync(writeFile, JSON.stringify(translatedData, null, 2), 'utf8');

    console.log('Translation completed and saved to file.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to count total items in JSON data
function countItems(json) {
  let count = 0;

  if (Array.isArray(json)) {
    count += json.length;
    for (const item of json) {
      count += countItems(item);
    }
  } else if (typeof json === 'object') {
    count += Object.keys(json).length;
    for (const key in json) {
      count += countItems(json[key]);
    }
  }

  return count;
}

// Usage example
const filePath = './paths.fr.json'; // Replace with your input JSON file path
const writeFile = './paths.en.json';
const options = {
  sourceLang: 'fr',            // Source language code
  targetLang: 'en',            // Target language code
  ignorePaths: ['tags', 'schema', 'security', 'produces', 'in', 'consumes', 'name', 'type', 'required', 'operationId', '$ref', 'enum', 'format']        // Paths to ignore (tags)
};

translateFile(filePath, writeFile, options);
