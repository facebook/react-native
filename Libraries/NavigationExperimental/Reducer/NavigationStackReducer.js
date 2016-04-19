/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationStackReducer
 * @flow
 */
'use strict';

var NavigationStateUtils = require('NavigationStateUtils');

import type {
  NavigationState,
  NavigationParentState,
  NavigationReducer,
} from 'NavigationTypeDefinition';

import type {
  BackAction,
} from 'NavigationRootContainer';

export type NavigationStackReducerAction = BackAction | {
  type: string,
};

export type ReducerForStateHandler = (state: NavigationState) => NavigationReducer;

export type PushedReducerForActionHandler = (action: any, lastState: NavigationParentState) => ?NavigationReducer;

export type StackReducerConfig = {
  /*
   * The initialState is that the reducer will use when there is no previous state.
   * Must be a NavigationParentState:
   *
   * {
   *   children: [
   *     {key: 'subState0'},
   *     {key: 'subState1'},
   *   ],
   *   index: 0,
   *   key: 'navStackKey'
   * }
   */
  initialState: NavigationParentState;

  /*
   * Returns the sub-reducer for a particular state to handle. This will be called
   * when we need to handle an action on a sub-state. If no reducer is returned,
   * no action will be taken
   */
  getReducerForState?: ReducerForStateHandler;

  /*
   * Returns a sub-reducer that will be used when pushing a new route. If a reducer
   * is returned, it be called to get the new state that will be pushed
   */
  getPushedReducerForAction: PushedReducerForActionHandler;
};

const defaultGetReducerForState = (initialState) => (state) => state || initialState;

function NavigationStackReducer({initialState, getReducerForState, getPushedReducerForAction}: StackReducerConfig): NavigationReducer {
  const getReducerForStateWithDefault = getReducerForState || defaultGetReducerForState;
  return function (lastState: ?NavigationState, action: any): NavigationState {
    if (!lastState) {
      return initialState;
    }
    const lastParentState = NavigationStateUtils.getParent(lastState);
    if (!lastParentState) {
      return lastState;
    }

    const activeSubState = lastParentState.children[lastParentState.index];
    const activeSubReducer = getReducerForStateWithDefault(activeSubState);
    const nextActiveState = activeSubReducer(activeSubState, action);
    if (nextActiveState !== activeSubState) {
      const nextChildren = [...lastParentState.children];
      nextChildren[lastParentState.index] = nextActiveState;
      return {
        ...lastParentState,
        children: nextChildren,
      };
    }

    const subReducerToPush = getPushedReducerForAction(action, lastParentState);
    if (subReducerToPush) {
      return NavigationStateUtils.push(
        lastParentState,
        subReducerToPush(null, action)
      );
    }

    switch (action.type) {
      case 'back':
      case 'BackAction':
        if (lastParentState.index === 0 || lastParentState.children.length === 1) {
          return lastParentState;
        }
        return NavigationStateUtils.pop(lastParentState);
    }

    return lastParentState;
  };
}

module.exports = NavigationStackReducer;
