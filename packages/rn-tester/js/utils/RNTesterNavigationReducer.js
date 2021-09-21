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

const RNTesterList = require('./RNTesterList');
import type {RNTesterExample} from '../types/RNTesterTypes';

export type RNTesterNavigationState = {
  openExample: ?string,
  screen: string,
  Components: {...},
  Api: {...},
  recentComponents: Array<RNTesterExample>,
  recentApis: Array<RNTesterExample>,
  AddApi: (apiName: string, api: RNTesterExample) => mixed,
  AddComponent: (componentName: string, component: RNTesterExample) => mixed,
  RemoveApi: (apiName: string) => mixed,
  RemoveComponent: (componentName: string) => mixed,
  checkBookmark: (title: string, key: string) => mixed,
  updateRecentlyViewedList: (item: RNTesterExample, key: string) => mixed,
  ...
};

function RNTesterNavigationReducer(
  state: RNTesterNavigationState,
  action: any,
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
      ...state,
      screen: action.screen ?? 'component',
      // A null openExample will cause the views to display the RNTester example list
      openExample: null,
    };
  }

  if (action.screen === 'bookmark' && action.type === 'RNTesterBackAction') {
    return {
      ...state,
      screen: 'component',
      openExample: null,
    };
  }

  if (action.type === 'RNTesterExampleAction') {
    // Make sure we see the module before returning the new state
    const ExampleModule = RNTesterList.Modules[action.openExample];
    if (ExampleModule) {
      return {
        ...state,
        openExample: action.openExample,
      };
    }
  }

  return state;
}

module.exports = RNTesterNavigationReducer;
