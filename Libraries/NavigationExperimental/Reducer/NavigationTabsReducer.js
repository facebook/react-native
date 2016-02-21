/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationTabsReducer
 * @flow
 */
'use strict';

const NavigationFindReducer = require('NavigationFindReducer');
const NavigationStateUtils = require('NavigationStateUtils');

import type {
  NavigationReducer,
  NavigationReducerWithDefault,
  NavigationState,
  NavigationParentState
} from 'NavigationStateUtils';

const ActionTypes = {
  JUMP_TO: 'react-native/NavigationExperimental/tabs-jumpTo',
  ON_TAB_ACTION: 'react-native/NavigationExperimental/tabs-onTabAction',
};

const DEFAULT_KEY = 'TABS_STATE_DEFAULT_KEY';

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

export type OnTabAction = {
  type: string,
  index: number,
  action: any,
};
function NavigationTabsOnTabAction(index: number, action: any): OnTabAction {
  return {
    type: ActionTypes.ON_TAB_ACTION,
    index,
    action,
  };
}

type TabsReducerConfig = {
  key: string;
  initialIndex: ?number;
  tabReducers: Array<NavigationReducerWithDefault>;
};

function NavigationTabsReducer({key, initialIndex, tabReducers}: TabsReducerConfig): NavigationReducer {
  if (initialIndex == null) {
    initialIndex = 0;
  }
  if (key == null) {
    key = DEFAULT_KEY;
  }
  return function(lastNavState: ?NavigationState, action: ?any): ?NavigationState {
    if (!lastNavState) {
      lastNavState = {
        children: tabReducers.map(reducer => reducer(null, null)),
        index: initialIndex,
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
    if (action.type === ActionTypes.ON_TAB_ACTION) {
      const onTabAction: OnTabAction = action;
      const lastTabRoute = lastParentNavState.children[onTabAction.index];
      const tabReducer = tabReducers[onTabAction.index];
      if (tabReducer) {
        const newTabRoute = tabReducer(lastTabRoute, action.action);
        if (newTabRoute && newTabRoute !== lastTabRoute) {
          let navState = NavigationStateUtils.replaceAtIndex(
            lastParentNavState,
            onTabAction.index,
            newTabRoute
          );
          navState = NavigationStateUtils.jumpToIndex(
            navState,
            onTabAction.index
          );
          return navState;
        }
      }
    }
    const subReducers = tabReducers.map((tabReducer, tabIndex) => {
      return function reduceTab(lastNavState: ?NavigationState, tabAction: ?any): ?NavigationState {
        if (!tabReducer || !lastNavState) {
          return lastNavState;
        }
        const lastParentNavState = NavigationStateUtils.getParent(lastNavState);
        const lastSubTabState = lastParentNavState && lastParentNavState.children[tabIndex];
        const nextSubTabState = tabReducer(lastSubTabState, tabAction);
        if (nextSubTabState && lastSubTabState !== nextSubTabState) {
          const tabs = lastParentNavState && lastParentNavState.children || [];
          tabs[tabIndex] = nextSubTabState;
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
    subReducers.unshift(selectedTabReducer);
    subReducers.push((lastParentNavState: ?NavigationState, action: ?any) => {
      if (lastParentNavState && action && action.type === 'BackAction') {
        return NavigationStateUtils.jumpToIndex(
          lastParentNavState,
          0
        );
      }
      return lastParentNavState;
    });
    const findReducer = NavigationFindReducer(subReducers);
    return findReducer(lastParentNavState, action);
  };
}

NavigationTabsReducer.JumpToAction = NavigationTabsJumpToAction;
NavigationTabsReducer.OnTabAction = NavigationTabsOnTabAction;

module.exports = NavigationTabsReducer;
