/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {RNTesterState, ComponentList} from '../types/RNTesterTypes';

export const RNTesterActionsType = {
  INIT_FROM_STORAGE: 'INIT_FROM_STORAGE',
  NAVBAR_PRESS: 'NAVBAR_PRESS',
  EXAMPLE_CARD_PRESS: 'EXAMPLE_CARD_PRESS',
  BOOKMARK_PRESS: 'BOOKMARK_PRESS',
  BACK_BUTTON_PRESS: 'BACK_BUTTON_PRESS',
};

const getUpdatedBookmarks = ({
  exampleType,
  key,
  bookmarks,
}: {
  exampleType: string,
  key: string,
  bookmarks: ComponentList,
}) => {
  const updatedBookmarks = bookmarks
    ? {...bookmarks}
    : {components: [], apis: []};

  if (updatedBookmarks[exampleType].includes(key)) {
    updatedBookmarks[exampleType] = updatedBookmarks[exampleType].filter(
      k => k !== key,
    );
  } else {
    updatedBookmarks[exampleType].push(key);
  }
  return updatedBookmarks;
};

const getUpdatedRecentlyUsed = ({
  exampleType,
  key,
  recentlyUsed,
}: {
  exampleType: string,
  key: string,
  recentlyUsed: ComponentList,
}) => {
  const updatedRecentlyUsed = recentlyUsed
    ? {...recentlyUsed}
    : {components: [], apis: []};

  let existingKeys = updatedRecentlyUsed[exampleType];

  if (existingKeys.includes(key)) {
    existingKeys = existingKeys.filter(k => k !== key);
  }
  existingKeys.unshift(key);

  updatedRecentlyUsed[exampleType] = existingKeys.slice(0, 5);

  return updatedRecentlyUsed;
};

export const RNTesterReducer = (
  state: RNTesterState,
  action: {type: string, data: any},
): RNTesterState => {
  switch (action.type) {
    case RNTesterActionsType.INIT_FROM_STORAGE:
      return action.data;
    case RNTesterActionsType.NAVBAR_PRESS:
      return {
        ...state,
        openExample: null,
        screen: action.data.screen,
      };
    case RNTesterActionsType.EXAMPLE_CARD_PRESS:
      return {
        ...state,
        openExample: action.data.key,
        recentlyUsed: getUpdatedRecentlyUsed({
          exampleType: action.data.exampleType,
          key: action.data.key,
          recentlyUsed: state.recentlyUsed,
        }),
      };
    case RNTesterActionsType.BOOKMARK_PRESS:
      return {
        ...state,
        bookmarks: getUpdatedBookmarks({
          exampleType: action.data.exampleType,
          key: action.data.key,
          bookmarks: state.bookmarks,
        }),
      };
    case RNTesterActionsType.BACK_BUTTON_PRESS:
      return {
        ...state,
        openExample: null,
      };
    default:
      throw new Error(`Invalid action type ${action.type}`);
  }
};
