/**
 * Copyright (c) 2015-present, Facebook, Inc.
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

const BundleBase = require('./BundleBase');
const ModuleTransport = require('../lib/ModuleTransport');

import type Resolver from '../Resolver';
import type ResolutionResponse
  from '../node-haste/DependencyGraph/ResolutionResponse';
import type Module from '../node-haste/Module';

class HMRBundle extends BundleBase {
  _sourceMappingURLFn: (hmrpath: string) => mixed;
  _sourceMappingURLs: Array<mixed>;
  _sourceURLFn: (hmrpath: string) => mixed;
  _sourceURLs: Array<mixed>;

  constructor({
    sourceURLFn,
    sourceMappingURLFn,
  }: {
    sourceURLFn: (hmrpath: string) => mixed,
    sourceMappingURLFn: (hmrpath: string) => mixed,
  }) {
    super();
    this._sourceURLFn = sourceURLFn;
    this._sourceMappingURLFn = sourceMappingURLFn;
    this._sourceURLs = [];
    this._sourceMappingURLs = [];
  }

  addModule(
    /* $FlowFixMe: broken OOP design: function signature should be the same */
    resolver: Resolver,
    /* $FlowFixMe: broken OOP design: function signature should be the same */
    response: ResolutionResponse<Module, {}>,
    /* $FlowFixMe: broken OOP design: function signature should be the same */
    module: Module,
    /* $FlowFixMe: broken OOP design: function signature should be the same */
    moduleTransport: ModuleTransport,
  ) {
    const code = resolver.resolveRequires(
      response,
      module,
      moduleTransport.code,
      /* $FlowFixMe: may not exist */
      moduleTransport.meta.dependencyOffsets,
    );

    super.addModule(new ModuleTransport({...moduleTransport, code}));
    this._sourceMappingURLs.push(
      this._sourceMappingURLFn(moduleTransport.sourcePath),
    );
    this._sourceURLs.push(this._sourceURLFn(moduleTransport.sourcePath));
    // inconsistent with parent class return type
    return (Promise.resolve(): any);
  }

  getModulesIdsAndCode(): Array<{id: string, code: string}> {
    return this.__modules.map(module => {
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
