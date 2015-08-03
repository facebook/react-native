'use strict';

const isAbsolutePath = require('absolute-path');
const path = require('path');

class Package {

  constructor(file, fastfs) {
    this.path = path.resolve(file);
    this.root = path.dirname(this.path);
    this._fastfs = fastfs;
    this.type = 'Package';
  }

  getMain() {
    return this._read().then(json => {
      if (typeof json.browser === 'string') {
        return path.join(this.root, json.browser);
      }

      let main = json.main || 'index';

      if (json.browser && typeof json.browser === 'object') {
        main = json.browser[main] ||
          json.browser[main + '.js'] ||
          json.browser[main + '.json'] ||
          json.browser[main.replace(/(\.js|\.json)$/, '')] ||
          main;
      }

      return path.join(this.root, main);
    });
  }

  isHaste() {
    return this._read().then(json => !!json.name);
  }

  getName() {
    return this._read().then(json => json.name);
  }

  redirectRequire(name) {
    return this._read().then(json => {
      const {browser} = json;

      if (!browser || typeof browser !== 'object') {
        return name;
      }

      if (name[0] !== '/') {
        return browser[name] || name;
      }

      if (!isAbsolutePath(name)) {
        throw new Error(`Expected ${name} to be absolute path`);
      }

      const relPath = './' + path.relative(this.root, name);
      const redirect = browser[relPath] ||
              browser[relPath + '.js'] ||
              browser[relPath + '.json'];
      if (redirect) {
        return path.join(
          this.root,
          redirect
        );
      }

      return name;
    });
  }

  _read() {
    if (!this._reading) {
      var path = this.path;
      this._reading = this._fastfs.readFile(this.path)
        .then(jsonStr => {
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            e.message = 'Error while parsing ' + path + ': ' + e.message;
            throw e;
          }
        });
    }

    return this._reading;
  }
}

module.exports = Package;
