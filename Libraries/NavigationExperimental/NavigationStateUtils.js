/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationStateUtils
 * @flow
 */
'use strict';

const invariant = require('fbjs/lib/invariant');

import type {
  NavigationRoute,
  NavigationState,
} from 'NavigationTypeDefinition';

/**
 * Utilities to perform atomic operation with navigate state and routes.
 */

/**
 * Gets a route by key
 */
function get(state: NavigationState, key: string): ?NavigationRoute {
  return state.routes.find(route => route.key === key) || null;
}

/**
 * Returns the first index at which a given route's key can be found in the
 * routes of the navigation state, or -1 if it is not present.
 */
function indexOf(state: NavigationState, key: string): number {
  return state.routes.map(route => route.key).indexOf(key);
}

/**
 * Returns `true` at which a given route's key can be found in the
 * routes of the navigation state.
 */
function has(state: NavigationState, key: string): boolean {
  return !!state.routes.some(route => route.key === key);
}

/**
 * Pushes a new route into the navigation state.
 * Note that this moves the index to the positon to where the last route in the
 * stack is at.
 */
function push(state: NavigationState, route: NavigationRoute): NavigationState {
  invariant(
    indexOf(state, route.key) === -1,
    'should not push route with duplicated key %s',
    route.key,
  );

  const routes = [
    ...state.routes,
    route,
  ];

  return {
    ...state,
    index: routes.length - 1,
    routes,
  };
}

/**
 * Pops out a route from the navigation state.
 * Note that this moves the index to the positon to where the last route in the
 * stack is at.
 */
function pop(state: NavigationState): NavigationState {
  if (state.index <= 0) {
    // [Note]: Over-popping does not throw error. Instead, it will be no-op.
    return state;
  }
  const routes = state.routes.slice(0, -1);
  return {
    ...state,
    index: routes.length - 1,
    routes,
  };
}

/**
 * Sets the focused route of the navigation state by index.
 */
function jumpToIndex(state: NavigationState, index: number): NavigationState {
  if (index === state.index) {
    return state;
  }

  invariant(!!state.routes[index], 'invalid index %s to jump to', index);

  return {
    ...state,
    index,
  };
}

/**
 * Sets the focused route of the navigation state by key.
 */
function jumpTo(state: NavigationState, key: string): NavigationState {
  const index = indexOf(state, key);
  return jumpToIndex(state, index);
}

/**
 * Replace a route by a key.
 * Note that this moves the index to the positon to where the new route in the
 * stack is at.
 */
function replaceAt(
  state: NavigationState,
  key: string,
  route: NavigationRoute,
): NavigationState {
  const index = indexOf(state, key);
  return replaceAtIndex(state, index, route);
}

/**
 * Replace a route by a index.
 * Note that this moves the index to the positon to where the new route in the
 * stack is at.
 */
function replaceAtIndex(
  state: NavigationState,
  index: number,
  route: NavigationRoute,
): NavigationState {
  invariant(
    !!state.routes[index],
    'invalid index %s for replacing route %s',
    index,
    route.key,
  );

  if (state.routes[index] === route) {
    return state;
  }

  const routes = state.routes.slice();
  routes[index] = route;

  return {
    ...state,
    index,
    routes,
  };
}

/**
 * Resets all routes.
 * Note that this moves the index to the positon to where the last route in the
 * stack is at if the param `index` isn't provided.
 */
function reset(
  state: NavigationState,
  routes: Array<NavigationRoute>,
  index?: number,
): NavigationState {
  invariant(
    routes.length && Array.isArray(routes),
    'invalid routes to replace',
  );

  const nextIndex: number = index === undefined ? routes.length - 1 : index;

  if (state.routes.length === routes.length && state.index === nextIndex) {
    const compare = (route, ii) => routes[ii] === route;
    if (state.routes.every(compare)) {
      return state;
    }
  }

  invariant(!!routes[nextIndex], 'invalid index %s to reset', nextIndex);

  return {
    ...state,
    index: nextIndex,
    routes,
  };
}

const NavigationStateUtils = {
  get: get,
  has,
  indexOf,
  jumpTo,
  jumpToIndex,
  pop,
  push,
  replaceAt,
  replaceAtIndex,
  reset,
};

module.exports = NavigationStateUtils;
