/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * Set up alert().
 * You can use this module directly, or just require InitializeCore.
 */
if (!global.alert) {
  global.alert = function (text: string) {
    // Require Alert on demand. Requiring it too early can lead to issues
    // with things like Platform not being fully initialized.
    require('../Alert/Alert').default.alert('Alert', '' + text);
  };
}
