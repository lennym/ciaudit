const path = require('path');
const { readFile } = require('fs/promises');

const loadIgnoreFile = async file => {
  if (!file) {
    return {};
  }
  if (typeof file !== 'string') {
    throw new Error('--ignorefile must be a string');
  }
  try {
    const config = await readFile(path.resolve(process.cwd(), file));
    return config.toString().split('\n').map(s => s.trim()).filter(Boolean).filter(str => str.substr(0, 1) !== '#' );
  } catch (e) {
    if (e.code === 'ENOENT') {
      return [];
    }
  }
};

module.exports = loadIgnoreFile;
