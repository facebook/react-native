/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationStackReducer
 * @flow-broken
 */
'use strict';

const NavigationStateUtils = require('NavigationStateUtils');

import type {
  NavigationRoute,
  NavigationState,
  NavigationReducer,
} from 'NavigationTypeDefinition';

export type ReducerForStateHandler = (state: NavigationRoute) => NavigationReducer;

export type PushedReducerForActionHandler = (action: any, lastState: NavigationState) => ?NavigationReducer;

export type StackReducerConfig = {
  /*
   * The initialState is that the reducer will use when there is no previous state.
   * Must be a NavigationState:
   *
   * {
   *   routes: [
   *     {key: 'subState0'},
   *     {key: 'subState1'},
   *   ],
   *   index: 0,
   *   key: 'navStackKey'
   * }
   */
  initialState: NavigationState;

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
  return function (lastState: ?NavigationRoute, action: any): NavigationRoute {
    if (!lastState) {
      return initialState;
    }
    const lastParentState = NavigationStateUtils.getParent(lastState);
    if (!lastParentState) {
      return lastState;
    }

    const activeSubState = lastParentState.routes[lastParentState.index];
    const activeSubReducer = getReducerForStateWithDefault(activeSubState);
    const nextActiveState = activeSubReducer(activeSubState, action);
    if (nextActiveState !== activeSubState) {
      const nextChildren = [...lastParentState.routes];
      nextChildren[lastParentState.index] = nextActiveState;
      return {
        ...lastParentState,
        routes: nextChildren,
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
        if (lastParentState.index === 0 || lastParentState.routes.length === 1) {
          return lastParentState;
        }
        return NavigationStateUtils.pop(lastParentState);
    }

    return lastParentState;
  };
}

module.exports = NavigationStackReducer;
