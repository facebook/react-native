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

function getParent(state: NavigationRoute): ?NavigationState {
  if (
    (state instanceof Object) &&
    (state.children instanceof Array) &&
    (state.children[0] !== undefined) &&
    (typeof state.index === 'number') &&
    (state.children[state.index] !== undefined)
  ) {
    return state;
  }
  return null;
}

function get(state: NavigationRoute, key: string): ?NavigationRoute {
  const parentState = getParent(state);
  if (!parentState) {
    return null;
  }
  const childState = parentState.children.find(child => child.key === key);
  return childState || null;
}

function indexOf(state: NavigationRoute, key: string): ?number {
  const parentState = getParent(state);
  if (!parentState) {
    return null;
  }
  const index = parentState.children.map(child => child.key).indexOf(key);
  if (index === -1) {
    return null;
  }
  return index;
}

function push(state: NavigationState, newChildState: NavigationRoute): NavigationState {
  var lastChildren: Array<NavigationRoute> = state.children;
  return {
    ...state,
    children: [
      ...lastChildren,
      newChildState,
    ],
    index: lastChildren.length,
  };
}

function pop(state: NavigationState): NavigationState {
  const lastChildren = state.children;
  return {
    ...state,
    children: lastChildren.slice(0, lastChildren.length - 1),
    index: lastChildren.length - 2,
  };
}

function reset(state: NavigationRoute, nextChildren: ?Array<NavigationRoute>, nextIndex: ?number): NavigationRoute {
  const parentState = getParent(state);
  if (!parentState) {
    return state;
  }
  const children = nextChildren || parentState.children;
  const index = nextIndex == null ? parentState.index : nextIndex;
  if (children === parentState.children && index === parentState.index) {
    return state;
  }
  return {
    ...parentState,
    children,
    index,
  };
}

function set(state: ?NavigationRoute, key: string, nextChildren: Array<NavigationRoute>, nextIndex: number): NavigationRoute {
  if (!state) {
    return {
      children: nextChildren,
      index: nextIndex,
      key,
    };
  }
  const parentState = getParent(state);
  if (!parentState) {
    return {
      children: nextChildren,
      index: nextIndex,
      key,
    };
  }
  if (nextChildren === parentState.children && nextIndex === parentState.index && key === parentState.key) {
    return parentState;
  }
  return {
    ...parentState,
    children: nextChildren,
    index: nextIndex,
    key,
  };
}

function jumpToIndex(state: NavigationRoute, index: number): NavigationRoute {
  const parentState = getParent(state);
  if (parentState && parentState.index === index) {
    return parentState;
  }
  return {
    ...parentState,
    index,
  };
}

function jumpTo(state: NavigationRoute, key: string): NavigationRoute {
  const parentState = getParent(state);
  if (!parentState) {
    return state;
  }
  const index = parentState.children.indexOf(parentState.children.find(child => child.key === key));
  invariant(
    index !== -1,
    'Cannot find child with matching key in this NavigationRoute'
  );
  return {
    ...parentState,
    index,
  };
}

function replaceAt(state: NavigationRoute, key: string, newState: NavigationRoute): NavigationRoute {
  const parentState = getParent(state);
  if (!parentState) {
    return state;
  }
  const children = [...parentState.children];
  const index = parentState.children.indexOf(parentState.children.find(child => child.key === key));
  invariant(
    index !== -1,
    'Cannot find child with matching key in this NavigationRoute'
  );
  children[index] = newState;
  return {
    ...parentState,
    children,
  };
}

function replaceAtIndex(state: NavigationRoute, index: number, newState: NavigationRoute): NavigationRoute {
  const parentState = getParent(state);
  if (!parentState) {
    return state;
  }
  const children = [...parentState.children];
  children[index] = newState;
  return {
    ...parentState,
    children,
  };
}

const NavigationStateUtils = {
  getParent,
  get: get,
  indexOf,
  push,
  pop,
  reset,
  set: set,
  jumpToIndex,
  jumpTo,
  replaceAt,
  replaceAtIndex,
};

module.exports = NavigationStateUtils;
