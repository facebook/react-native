/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const isAbsolutePath = require('absolute-path');
const path = require('path');

class Package {

  constructor({ file, fastfs, cache }) {
    this.path = path.resolve(file);
    this.root = path.dirname(this.path);
    this._fastfs = fastfs;
    this.type = 'Package';
    this._cache = cache;
  }

  getMain() {
    return this.read().then(json => {
      var replacements = getReplacements(json);
      if (typeof replacements === 'string') {
        return path.join(this.root, replacements);
      }

      let main = json.main || 'index';

      if (replacements && typeof replacements === 'object') {
        main = replacements[main] ||
          replacements[main + '.js'] ||
          replacements[main + '.json'] ||
          replacements[main.replace(/(\.js|\.json)$/, '')] ||
          main;
      }

      return path.join(this.root, main);
    });
  }

  isHaste() {
    return this._cache.get(this.path, 'package-haste', () =>
      this.read().then(json => !!json.name)
    );
  }

  getName() {
    return this._cache.get(this.path, 'package-name', () =>
      this.read().then(json => json.name)
    );
  }

  invalidate() {
    this._cache.invalidate(this.path);
  }

  redirectRequire(name) {
    return this.read().then(json => {
      var replacements = getReplacements(json);

      if (!replacements || typeof replacements !== 'object') {
        return name;
      }

      if (!isAbsolutePath(name)) {
        const replacement = replacements[name];
        // support exclude with "someDependency": false
        return replacement === false
          ? false
          : replacement || name;
      }

      let relPath = './' + path.relative(this.root, name);
      if (path.sep !== '/') {
        relPath = relPath.replace(path.sep, '/');
      }

      let redirect = replacements[relPath];

      // false is a valid value
      if (redirect == null) {
        redirect = replacements[relPath + '.js'];
        if (redirect == null) {
          redirect = replacements[relPath + '.json'];
        }
      }

      // support exclude with "./someFile": false
      if (redirect === false) {
        return false;
      }

      if (redirect) {
        return path.join(
          this.root,
          redirect
        );
      }

      return name;
    });
  }

  read() {
    if (!this._reading) {
      this._reading = this._fastfs.readFile(this.path)
        .then(jsonStr => JSON.parse(jsonStr));
    }

    return this._reading;
  }
}

function getReplacements(pkg) {
  let rn = pkg['react-native'];
  let browser = pkg.browser;
  if (rn == null) {
    return browser;
  }

  if (browser == null) {
    return rn;
  }

  if (typeof rn === 'string') {
    rn = { [pkg.main]: rn };
  }

  if (typeof browser === 'string') {
    browser = { [pkg.main]: browser };
  }

  // merge with "browser" as default,
  // "react-native" as override
  return { ...browser, ...rn };
}

module.exports = Package;
