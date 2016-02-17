/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const _ = require('underscore');
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

  addModule(resolver, response, module, transformed) {
    return resolver.resolveRequires(response,
      module,
      transformed.code,
    ).then(({name, code}) => {
      // need to be in single line so that lines match on sourcemaps
      code = `__accept(${JSON.stringify(name)}, function(global, require, module, exports) { ${code} });`;

      const moduleTransport = new ModuleTransport({
        code,
        name,
        map: transformed.map,
        sourceCode: transformed.sourceCode,
        sourcePath: transformed.sourcePath,
        virtual: transformed.virtual,
      });

      super.addModule(moduleTransport);
      this._sourceMappingURLs.push(this._sourceMappingURLFn(moduleTransport.sourcePath));
      this._sourceURLs.push(this._sourceURLFn(moduleTransport.sourcePath));
    });
  }

  getModulesCode() {
    return this._modules.map(module => module.code);
  }

  getSourceURLs() {
    return this._sourceURLs;
  }

  getSourceMappingURLs() {
    return this._sourceMappingURLs;
  }
}

module.exports = HMRBundle;
