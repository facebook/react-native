/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

'use strict';

const fs = require('fs');
const isAbsolutePath = require('absolute-path');
const path = require('path');

type PackageContent = {
  name: string,
  'react-native': mixed,
  browser: mixed,
  main: ?string,
};

class Package {
  path: string;
  root: string;
  type: string;

  _content: ?PackageContent;

  constructor({file}: {file: string}) {
    this.path = path.resolve(file);
    this.root = path.dirname(this.path);
    this.type = 'Package';
    this._content = null;
  }

  getMain(): string {
    const json = this.read();
    var replacements = getReplacements(json);
    if (typeof replacements === 'string') {
      return path.join(this.root, replacements);
    }

    let main = json.main || 'index';

    if (replacements && typeof replacements === 'object') {
      main =
        replacements[main] ||
        replacements[main + '.js'] ||
        replacements[main + '.json'] ||
        replacements[main.replace(/(\.js|\.json)$/, '')] ||
        main;
    }

    /* $FlowFixMe: `getReplacements` doesn't validate the return value. */
    return path.join(this.root, main);
  }

  isHaste(): boolean {
    return !!this.read().name;
  }

  getName(): Promise<string> {
    return Promise.resolve().then(() => this.read().name);
  }

  invalidate() {
    this._content = null;
  }

  redirectRequire(name: string): string | false {
    const json = this.read();
    const replacements = getReplacements(json);

    if (!replacements || typeof replacements !== 'object') {
      return name;
    }

    if (!isAbsolutePath(name)) {
      const replacement = replacements[name];
      // support exclude with "someDependency": false
      return replacement === false
        ? false
        : /* $FlowFixMe: type of replacements is not being validated */
          replacement || name;
    }

    let relPath = './' + path.relative(this.root, name);
    if (path.sep !== '/') {
      relPath = relPath.replace(new RegExp('\\' + path.sep, 'g'), '/');
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
        /* $FlowFixMe: `getReplacements` doesn't validate the return value. */
        redirect,
      );
    }

    return name;
  }

  read(): PackageContent {
    if (this._content == null) {
      this._content = JSON.parse(fs.readFileSync(this.path, 'utf8'));
    }
    return this._content;
  }
}

function getReplacements(pkg: PackageContent): mixed {
  let rn = pkg['react-native'];
  let browser = pkg.browser;
  if (rn == null) {
    return browser;
  }

  if (browser == null) {
    return rn;
  }

  if (typeof rn === 'string') {
    /* $FlowFixMe: It is likely unsafe to assume all packages would
     * contain a "main" */
    rn = {[pkg.main]: rn};
  }

  if (typeof browser === 'string') {
    /* $FlowFixMe: It is likely unsafe to assume all packages would
     * contain a "main" */
    browser = {[pkg.main]: browser};
  }

  // merge with "browser" as default,
  // "react-native" as override
  // $FlowFixMe(>=0.35.0) browser and rn should be objects
  return {...browser, ...rn};
}

module.exports = Package;
