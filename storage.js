'use strict';

const fs = require('fs');

class Storage {
  constructor(location = './storage') {
    this.location = location;
  }
  save(filename, data = '') {
    const path = `${this.location}/${filename}`;
    let prevData = '';
    const files = fs.readdirSync(this.location);
    if (files.includes(filename)) {
      prevData = fs.readFileSync(path, 'utf8');
    }
    fs.writeFileSync(path, prevData + `${data}\n`, () => { });
  }
  get(filename) {
    const data = fs.readFileSync(`${this.location}/${filename}`, 'utf8');
    return data.split('\n');
  }
  exists(filename) {
    const files = fs.readdirSync(this.location);
    return files.includes(filename);
  }
  load(collection) {
    const files = fs.readdirSync(this.location, 'utf8');
    for (const file of files) {
      const [first, second] = file.split('.txt');
      collection.set(first, []);
    }
  }
}

module.exports = Storage;