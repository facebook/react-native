/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

type BackPressEventName = 'backPress' | 'hardwareBackPress';
type BackPressHandler = () => ?boolean;

function emptyFunction(): void {}

type TBackHandler = {
  +exitApp: () => void,
  +addEventListener: (
    eventName: BackPressEventName,
    handler: BackPressHandler,
  ) => {remove: () => void, ...},
};

let BackHandler: TBackHandler = {
  exitApp: emptyFunction,
  addEventListener(_eventName: BackPressEventName, _handler: BackPressHandler) {
    return {
      remove: emptyFunction,
    };
  },
};

module.exports = BackHandler;
