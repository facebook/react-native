/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationTabsReducer
 * @flow-broken
 */
'use strict';

const NavigationFindReducer = require('NavigationFindReducer');
const NavigationStateUtils = require('NavigationStateUtils');

import type {
  NavigationReducer,
  NavigationRoute,
} from 'NavigationTypeDefinition';

const ActionTypes = {
  JUMP_TO: 'react-native/NavigationExperimental/tabs-jumpTo',
};

export type JumpToAction = {
  type: typeof ActionTypes.JUMP_TO,
  index: number,
};
function NavigationTabsJumpToAction(index: number): JumpToAction {
  return {
    type: ActionTypes.JUMP_TO,
    index,
  };
}

type TabsReducerConfig = {
  key: string;
  initialIndex: number;
  tabReducers: Array<NavigationReducer>;
};

function NavigationTabsReducer({key, initialIndex, tabReducers}: TabsReducerConfig): NavigationReducer {
  return function(lastNavState: ?NavigationRoute, action: ?any): NavigationRoute {
    if (!lastNavState) {
      lastNavState = {
        routes: tabReducers.map(reducer => reducer(null, null)),
        index: initialIndex || 0,
        key,
      };
    }
    const lastParentNavState = NavigationStateUtils.getParent(lastNavState);
    if (!action || !lastParentNavState) {
      return lastNavState;
    }
    if (
      action.type === ActionTypes.JUMP_TO &&
      action.index !== lastParentNavState.index
    ) {
      return NavigationStateUtils.jumpToIndex(
        lastParentNavState,
        action.index,
      );
    }
    const subReducers = tabReducers.map((tabReducer, tabIndex) => {
      return function(navState: ?NavigationRoute, tabAction: any): NavigationRoute {
        if (!navState) {
          return lastParentNavState;
        }
        const parentState = NavigationStateUtils.getParent(navState);
        const tabState = parentState && parentState.routes[tabIndex];
        const nextTabState = tabReducer(tabState, tabAction);
        if (nextTabState && tabState !== nextTabState) {
          const tabs = parentState && parentState.routes || [];
          tabs[tabIndex] = nextTabState;
          return {
            ...lastParentNavState,
            tabs,
            index: tabIndex,
          };
        }
        return lastParentNavState;
      };
    });
    let selectedTabReducer = subReducers.splice(lastParentNavState.index, 1)[0];
    subReducers.unshift(function(navState: ?NavigationRoute, action: any): NavigationRoute {
      if (navState && action.type === 'BackAction') {
        return NavigationStateUtils.jumpToIndex(
          lastParentNavState,
          initialIndex || 0
        );
      }
      return lastParentNavState;
    });
    subReducers.unshift(selectedTabReducer);
    const findReducer = NavigationFindReducer(subReducers, lastParentNavState);
    return findReducer(lastParentNavState, action);
  };
}

NavigationTabsReducer.JumpToAction = NavigationTabsJumpToAction;

module.exports = NavigationTabsReducer;
