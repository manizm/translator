const fs = require('fs');

/**
 * Recursively retrieves all keys from an object, including nested objects within arrays.
 * @param {Object} obj - The object to retrieve keys from.
 * @returns {Array} - An array of all keys in the object.
 */
function getAllKeys(obj) {
  let keys = [];

  if (Array.isArray(obj)) {
    // If the object is an array, iterate over each item
    obj.forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        // If the item is an object (excluding null), recursively retrieve keys
        keys = keys.concat(getAllKeys(item));
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    // If the object is an object (excluding null), iterate over each key
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Add the key to the keys array
        keys.push(key);
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          // If the value of the key is an object (excluding null), recursively retrieve keys
          keys = keys.concat(getAllKeys(obj[key]));
        }
      }
    }
  }

  return keys;
}

/**
 * Removes duplicate keys from an array.
 * @param {Array} keys - The array of keys.
 * @returns {Array} - The array with duplicate keys removed.
 */
function removeDuplicateKeys(keys) {
  return [...new Set(keys)];
}

const filePath = './some_file.json';
const outputFilePath = './allpaths.txt';

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the JSON file:', err);
    return;
  }

  try {
    const jsonObject = JSON.parse(data);
    const allKeys = getAllKeys(jsonObject);
    const uniqueKeys = removeDuplicateKeys(allKeys);

    // Write unique keys to output file
    fs.writeFile(outputFilePath, uniqueKeys.join('\n'), (writeErr) => {
      if (writeErr) {
        console.error('Error writing to the output file:', writeErr);
        return;
      }
      console.log(`Unique keys have been written to ${outputFilePath}`);
    });
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
  }
});