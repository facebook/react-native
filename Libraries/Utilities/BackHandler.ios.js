/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

module.exports = require('../Components/UnimplementedViews/UnimplementedView');

const invariant = require('invariant')

type BackPressEventName = 'backPress' | 'hardwareBackPress';

function emptyFunction(): void {}

type TBackHandler = {|
  +exitApp: () => void,
  +addEventListener: (
    eventName: BackPressEventName,
    handler: () => ?boolean,
  ) => {remove: () => void, ...},
  +removeEventListener: (
    eventName: BackPressEventName,
    handler: () => ?boolean,
  ) => void,
|};

let BackHandler: TBackHandler = {
  exitApp: emptyFunction,
  addEventListener(_eventName: BackPressEventName, _handler: Function) {
    invariant(_handler != null, 'Cannot register nullish callback to BackHandler')
    return {
      remove: emptyFunction,
    };
  },
  removeEventListener(_eventName: BackPressEventName, _handler: Function) {
    invariant(_handler != null, 'Cannot register nullish callback to BackHandler')
  },
};

module.exports = BackHandler;
