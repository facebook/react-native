/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationState
 * @flow
 */
'use strict';

const invariant = require('invariant');

export type NavigationState = {
  key: string;
};

export type NavigationParentState = {
  key: string;
  index: number;
  children: Array<NavigationState>;
};

export type NavigationReducer = (
  state: ?NavigationState,
  action: ?any
) => ?NavigationState;

export type NavigationReducerWithDefault = (
  state: ?NavigationState,
  action: ?any
) => NavigationState;

export function getParent(state: NavigationState): ?NavigationParentState {
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

export function get(state: NavigationState, key: string): ?NavigationState {
  const parentState = getParent(state);
  if (!parentState) {
    return null;
  }
  const childState = parentState.children.find(child => child.key === key);
  return childState || null;
}

export function indexOf(state: NavigationState, key: string): ?number {
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

export function push(state: NavigationState, newChildState: NavigationState): NavigationState {
  const parentState = getParent(state);
  if (!parentState) {
    return state;
  }
  var lastChildren: Array<NavigationState> = parentState.children;
  return {
    ...parentState,
    children: [
      ...lastChildren,
      newChildState,
    ],
    index: lastChildren.length,
  };
}

export function pop(state: NavigationState): NavigationState {
  const parentState = getParent(state);
  if (!parentState) {
    return state;
  }
  const lastChildren = parentState.children;
  return {
    ...parentState,
    children: lastChildren.slice(0, lastChildren.length - 1),
    index: lastChildren.length - 2,
  };
}

export function reset(state: NavigationState, nextChildren: ?Array<NavigationState>, nextIndex: ?number): NavigationState {
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

export function set(state: ?NavigationState, key: string, nextChildren: Array<NavigationState>, nextIndex: number): NavigationState {
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

export function jumpToIndex(state: NavigationState, index: number): NavigationState {
  const parentState = getParent(state);
  return {
    ...parentState,
    index,
  };
}

export function jumpTo(state: NavigationState, key: string): NavigationState {
  const parentState = getParent(state);
  if (!parentState) {
    return state;
  }
  const index = parentState.children.indexOf(parentState.children.find(child => child.key === key));
  invariant(
    index !== -1,
    'Cannot find child with matching key in this NavigationState'
  );
  return {
    ...parentState,
    index,
  };
}

export function replaceAt(state: NavigationState, key: string, newState: NavigationState): NavigationState {
  const parentState = getParent(state);
  if (!parentState) {
    return state;
  }
  const children = [...parentState.children];
  const index = parentState.children.indexOf(parentState.children.find(child => child.key === key));
  invariant(
    index !== -1,
    'Cannot find child with matching key in this NavigationState'
  );
  children[index] = newState;
  return {
    ...parentState,
    children,
  };
}

export function replaceAtIndex(state: NavigationState, index: number, newState: NavigationState): NavigationState {
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
