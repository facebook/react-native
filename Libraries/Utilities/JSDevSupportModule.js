/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const JSDevSupport = require('../BatchedBridge/NativeModules').JSDevSupport;
const ReactNative = require('../Renderer/shims/ReactNative');

const JSDevSupportModule = {
  getJSHierarchy: function(tag: number) {
    try {
      const {
        computeComponentStackForErrorReporting,
      } = ReactNative.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      const componentStack = computeComponentStackForErrorReporting(tag);
      if (!componentStack) {
        JSDevSupport.onFailure(
          JSDevSupport.ERROR_CODE_VIEW_NOT_FOUND,
          "Component stack doesn't exist for tag " + tag,
        );
      } else {
        JSDevSupport.onSuccess(componentStack);
      }
    } catch (e) {
      JSDevSupport.onFailure(JSDevSupport.ERROR_CODE_EXCEPTION, e.message);
    }
  },
};

module.exports = JSDevSupportModule;
