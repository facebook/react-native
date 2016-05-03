/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const BundleBase = require('./BundleBase');
const ModuleTransport = require('../lib/ModuleTransport');

class HMRBundle extends BundleBase {
  constructor({sourceURLFn, sourceMappingURLFn}) {
    super();
    this._sourceURLFn = sourceURLFn
    this._sourceMappingURLFn = sourceMappingURLFn;
    this._sourceURLs = [];
    this._sourceMappingURLs = [];
  }

  addModule(resolver, response, module, moduleTransport) {
    const code = resolver.resolveRequires(
      response,
      module,
      moduleTransport.code,
      moduleTransport.meta.dependencyOffsets,
    );

    super.addModule(new ModuleTransport({...moduleTransport, code}));
    this._sourceMappingURLs.push(this._sourceMappingURLFn(moduleTransport.sourcePath));
    this._sourceURLs.push(this._sourceURLFn(moduleTransport.sourcePath));
    return Promise.resolve();
  }

  getModulesIdsAndCode() {
    return this._modules.map(module => {
      return {
        id: JSON.stringify(module.id),
        code: module.code,
      };
    });
  }

  getSourceURLs() {
    return this._sourceURLs;
  }

  getSourceMappingURLs() {
    return this._sourceMappingURLs;
  }
}

module.exports = HMRBundle;
