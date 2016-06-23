/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

const ReactNative = require('react-native');
// $FlowFixMe : This is a platform-forked component, and flow seems to only run on iOS?
const UIExplorerList = require('./UIExplorerList');

const {
  NavigationExperimental,
} = ReactNative;


const {
  StateUtils: NavigationStateUtils,
} = NavigationExperimental;

import type {NavigationState} from 'NavigationTypeDefinition';

export type UIExplorerNavigationState = {
  externalExample: ?string;
  stack: NavigationState;
};

const defaultGetReducerForState = (initialState) => (state) => state || initialState;

function getNavigationState(state: any): ?NavigationState {
  if (
    (state instanceof Object) &&
    (state.routes instanceof Array) &&
    (state.routes[0] !== undefined) &&
    (typeof state.index === 'number') &&
    (state.routes[state.index] !== undefined)
  ) {
    return state;
  }
  return null;
}

function StackReducer({initialState, getReducerForState, getPushedReducerForAction}: any): Function {
  const getReducerForStateWithDefault = getReducerForState || defaultGetReducerForState;
  return function (lastState: ?NavigationState, action: any): NavigationState {
    if (!lastState) {
      return initialState;
    }
    const lastParentState = getNavigationState(lastState);
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

const UIExplorerStackReducer = StackReducer({
  getPushedReducerForAction: (action, lastState) => {
    if (action.type === 'UIExplorerExampleAction' && UIExplorerList.Modules[action.openExample]) {
      if (lastState.routes.find(route => route.key === action.openExample)) {
        // The example is already open, we should avoid pushing examples twice
        return null;
      }
      return (state) => state || {key: action.openExample};
    }
    return null;
  },
  getReducerForState: (initialState) => (state) => state || initialState,
  initialState: {
    key: 'UIExplorerMainStack',
    index: 0,
    routes: [
      {key: 'AppList'},
    ],
  },
});

function UIExplorerNavigationReducer(lastState: ?UIExplorerNavigationState, action: any): UIExplorerNavigationState {
  if (!lastState) {
    return {
      externalExample: null,
      stack: UIExplorerStackReducer(null, action),
    };
  }
  if (action.type === 'UIExplorerListWithFilterAction') {
    return {
      externalExample: null,
      stack: {
        key: 'UIExplorerMainStack',
        index: 0,
        routes: [
          {
            key: 'AppList',
            filter: action.filter,
          },
        ],
      },
    };
  }
  if (action.type === 'BackAction' && lastState.externalExample) {
    return {
      ...lastState,
      externalExample: null,
    };
  }
  if (action.type === 'UIExplorerExampleAction') {
    const ExampleModule = UIExplorerList.Modules[action.openExample];
    if (ExampleModule && ExampleModule.external) {
      return {
        ...lastState,
        externalExample: action.openExample,
      };
    }
  }
  const newStack = UIExplorerStackReducer(lastState.stack, action);
  if (newStack !== lastState.stack) {
    return {
      externalExample: null,
      stack: newStack,
    };
  }
  return lastState;
}

module.exports = UIExplorerNavigationReducer;
