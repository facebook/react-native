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
  constructor() {
    super();
  }

  addModule(resolver, response, module, transformed) {
    return resolver.resolveRequires(response,
      module,
      transformed.code,
    ).then(({name, code}) => {
      code = `
        __accept(
          '${name}',
          function(global, require, module, exports) {
            ${code}
          }
        );
      `;

      const moduleTransport = new ModuleTransport({
        code,
        name,
        map: transformed.map,
        sourceCode: transformed.sourceCode,
        sourcePath: transformed.sourcePath,
        virtual: transformed.virtual,
      });

      super.addModule(moduleTransport);
    });
  }
}

module.exports = HMRBundle;
