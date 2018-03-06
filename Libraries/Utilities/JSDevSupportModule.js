/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule JSDevSupportModule
 * @flow
 */
'use strict';

var JSDevSupportModule = {
  getJSHierarchy: function (tag: string) {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const renderers = hook._renderers;
    const keys = Object.keys(renderers);
    const renderer = renderers[keys[0]];

    var result = renderer.getInspectorDataForViewTag(tag);
    var path = result.hierarchy.map( (item) => item.name).join(' -> ');
    require('NativeModules').JSDevSupport.setResult(path, null);
  },
};

module.exports = JSDevSupportModule;
