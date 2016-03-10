/**
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

const React = require('react-native');
// $FlowFixMe : This is a platform-forked component, and flow seems to only run on iOS?
const UIExplorerList = require('./UIExplorerList');
const {
  NavigationExperimental,
} = React;
const {
  Reducer: NavigationReducer,
} = NavigationExperimental;
const StackReducer = NavigationReducer.StackReducer;

import type {NavigationState} from 'NavigationTypeDefinition';

import type {UIExplorerAction} from './UIExplorerActions';

export type UIExplorerNavigationState = {
  externalExample: ?string;
  stack: NavigationState;
};

const UIExplorerStackReducer = StackReducer({
  getPushedReducerForAction: (action, lastState) => {
    if (action.type === 'UIExplorerExampleAction' && UIExplorerList.Modules[action.openExample]) {
      if (lastState.children.find(child => child.key === action.openExample)) {
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
    children: [
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
        children: [
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
    }
  }
  return lastState;
}

module.exports = UIExplorerNavigationReducer;
