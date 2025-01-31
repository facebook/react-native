/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {polyfillGlobal} from '../../../Libraries/Utilities/PolyfillFunctions';

let initialized = false;

export default function setUpDOM() {
  if (initialized) {
    return;
  }

  initialized = true;

  polyfillGlobal(
    'DOMRect',
    () => require('../webapis/geometry/DOMRect').default,
  );

  polyfillGlobal(
    'DOMRectReadOnly',
    () => require('../webapis/geometry/DOMRectReadOnly').default,
  );

  polyfillGlobal(
    'HTMLCollection',
    () => require('../webapis/dom/oldstylecollections/HTMLCollection').default,
  );

  polyfillGlobal(
    'NodeList',
    () => require('../webapis/dom/oldstylecollections/NodeList').default,
  );
}
