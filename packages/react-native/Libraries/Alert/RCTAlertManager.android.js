/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Args} from './NativeAlertManager';

import NativeDialogManagerAndroid from '../NativeModules/specs/NativeDialogManagerAndroid';

function emptyCallback() {}

export function alertWithArgs(
  args: Args,
  callback: (id: number, value: string) => void,
) {
  // TODO(5998984): Polyfill it correctly with DialogManagerAndroid
  if (!NativeDialogManagerAndroid) {
    return;
  }

  NativeDialogManagerAndroid.showAlert(
    // $FlowFixMe[prop-missing] - Mismatched platform interfaces.
    args,
    emptyCallback,
    // $FlowFixMe[incompatible-call] - Mismatched platform interfaces.
    callback || emptyCallback,
  );
}
