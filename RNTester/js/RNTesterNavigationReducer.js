/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule RNTesterNavigationReducer
 */
'use strict';

// $FlowFixMe : This is a platform-forked component, and flow seems to only run on iOS?
const RNTesterList = require('./RNTesterList');

export type RNTesterNavigationState = {
  openExample: ?string,
};

function RNTesterNavigationReducer(
  state: ?RNTesterNavigationState,
  action: any
): RNTesterNavigationState {

  if (
    // Default value is to see example list
    !state ||

    // Handle the explicit list action
    action.type === 'RNTesterListAction' ||

    // Handle requests to go back to the list when an example is open
    (state.openExample && action.type === 'RNTesterBackAction')
  ) {
    return {
      // A null openExample will cause the views to display the RNTester example list
      openExample: null,
    };
  }

  if (action.type === 'RNTesterExampleAction') {

    // Make sure we see the module before returning the new state
    const ExampleModule = RNTesterList.Modules[action.openExample];

    if (ExampleModule) {
      return {
        openExample: action.openExample,
      };
    }
  }

  return state;
}

module.exports = RNTesterNavigationReducer;
