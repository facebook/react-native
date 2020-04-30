/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

declare var __DEV__: boolean;

declare var __REACT_DEVTOOLS_GLOBAL_HOOK__: any; /*?{
  inject: ?((stuff: Object) => void)
};*/

declare var fetch: any;
declare var Headers: any;
declare var Request: any;
declare var Response: any;
declare module requestAnimationFrame {
  declare module.exports: (callback: any) => any;
}
