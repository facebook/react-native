/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

type BackPressEventName = 'backPress' | 'hardwareBackPress';

function emptyFunction(): void {}

type TBackHandler = {|
  +exitApp: () => void,
  +addEventListener: (
    eventName: BackPressEventName,
    handler: () => ?boolean,
  ) => {remove: () => void, ...},
|};

let BackHandler: TBackHandler = {
  exitApp: emptyFunction,
  addEventListener(_eventName: BackPressEventName, _handler: Function) {
    return {
      remove: emptyFunction,
    };
  },
};

module.exports = BackHandler;
