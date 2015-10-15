 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Activity = require('../../Activity');
const AssetModule_DEPRECATED = require('../AssetModule_DEPRECATED');
const Fastfs = require('../fastfs');
const debug = require('debug')('ReactNativePackager:DependencyGraph');
const path = require('path');
const Promise = require('promise');

class DeprecatedAssetMap {
  constructor({ fsCrawl, roots, assetExts, fileWatcher, ignoreFilePath, helpers }) {
    if (roots == null || roots.length === 0) {
      this._disabled = true;
      return;
    }

    this._helpers = helpers;
    this._map = Object.create(null);
    this._assetExts = assetExts;
    this._fastfs = new Fastfs(
      'Assets',
      roots,
      fileWatcher,
      { ignore: ignoreFilePath, crawling: fsCrawl }
    );

    this._fastfs.on('change', this._processFileChange.bind(this));
  }

  build() {
    if (this._disabled) {
      return Promise.resolve();
    }

    return this._fastfs.build().then(
      () => {
        const processAsset_DEPRECATEDActivity = Activity.startEvent(
          'Building (deprecated) Asset Map',
        );

        this._fastfs.findFilesByExts(this._assetExts).forEach(
          file => this._processAsset(file)
        );

        Activity.endEvent(processAsset_DEPRECATEDActivity);
      }
    );
  }

  resolve(fromModule, toModuleName) {
    if (this._disabled) {
      return null;
    }

    const assetMatch = toModuleName.match(/^image!(.+)/);
    if (assetMatch && assetMatch[1]) {
      if (!this._map[assetMatch[1]]) {
        debug('WARINING: Cannot find asset:', assetMatch[1]);
        return null;
      }
      return this._map[assetMatch[1]];
    }
  }

  _processAsset(file) {
    let ext = this._helpers.extname(file);
    if (this._assetExts.indexOf(ext) !== -1) {
      let name = assetName(file, ext);
      if (this._map[name] != null) {
        debug('Conflcting assets', name);
      }

      this._map[name] = new AssetModule_DEPRECATED(file);
    }
  }

  _processFileChange(type, filePath, root, fstat) {
    const name = assetName(filePath);
    if (type === 'change' || type === 'delete') {
      delete this._map[name];
    }

    if (type === 'change' || type === 'add') {
      this._processAsset(path.join(root, filePath));
    }
  }
}

function assetName(file, ext) {
  return path.basename(file, '.' + ext).replace(/@[\d\.]+x/, '');
}

module.exports = DeprecatedAssetMap;
