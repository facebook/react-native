/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
    console.error('StackOverflowException rendering JSComponent: ' + path);
    require('NativeModules').JSDevSupport.setResult(path, null);
  },
};

module.exports = JSDevSupportModule;
