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

import {themes} from '../components/RNTesterTheme';

const RNTesterList = require('./RNTesterList');
import {Appearance} from 'react-native';

export type RNTesterNavigationState = {
  openExample: ?string,
  theme: ?any,
};

function RNTesterNavigationReducer(
  state: ?RNTesterNavigationState,
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
      // A null openExample will cause the views to display the RNTester example list
      openExample: null,
      theme:
        Appearance.get('colorScheme') === 'dark' ? themes.dark : themes.light,
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

  if (action.type === 'RNTesterThemeAction') {
    if (action.colorScheme) {
      return {
        theme: action.colorScheme === 'dark' ? themes.dark : themes.light,
      };
    }
  }

  return state;
}

module.exports = RNTesterNavigationReducer;
