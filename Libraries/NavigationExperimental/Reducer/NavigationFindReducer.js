/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationFindReducer
 * @flow
 */
'use strict';

/*
 * NavigationFindReducer takes an array of reducers, and returns a reducer that
 * iterates through all of the reducers and the result of the first reducer
 * that modifies the input
 */

import type {
  NavigationState,
  NavigationReducer
} from 'NavigationTypeDefinition';

function NavigationFindReducer(
  reducers: Array<NavigationReducer>,
  defaultState: NavigationState,
): NavigationReducer {
  return function(lastState: ?NavigationState, action: ?any): NavigationState {
    for (let i = 0; i < reducers.length; i++) {
      let reducer = reducers[i];
      let newState = reducer(lastState, action);
      if (newState !== lastState) {
        return newState || defaultState;
      }
    }
    return lastState || defaultState;
  };
}

module.exports = NavigationFindReducer;
