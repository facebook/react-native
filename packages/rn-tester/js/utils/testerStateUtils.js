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

import {AsyncStorage} from 'react-native';

import RNTesterList from './RNTesterList';

import type {
  ExamplesList,
  RNTesterState,
  ComponentList,
} from '../types/RNTesterTypes';

export const Screens = {
  COMPONENTS: 'components',
  APIS: 'apis',
  BOOKMARKS: 'bookmarks',
};

export const initialState: RNTesterState = {
  openExample: null,
  screen: null,
  bookmarks: null,
  recentlyUsed: null,
};

const filterEmptySections = (examplesList: ExamplesList): any => {
  const filteredSections = {};
  const sectionKeys = Object.keys(examplesList);

  sectionKeys.forEach(key => {
    filteredSections[key] = examplesList[key].filter(
      section => section.data.length > 0,
    );
  });

  return filteredSections;
};

export const getExamplesListWithBookmarksAndRecentlyUsed = ({
  bookmarks,
  recentlyUsed,
}: {
  bookmarks: ComponentList,
  recentlyUsed: ComponentList,
}): ExamplesList | null => {
  // Return early if state has not been initialized from storage
  if (!bookmarks || !recentlyUsed) {
    return null;
  }

  const components = RNTesterList.ComponentExamples.map(componentExample => ({
    ...componentExample,
    isBookmarked: bookmarks.components.includes(componentExample.key),
    exampleType: Screens.COMPONENTS,
  }));

  const recentlyUsedComponents = recentlyUsed.components
    .map(recentComponentKey =>
      components.find(component => component.key === recentComponentKey),
    )
    .filter(Boolean);

  const bookmarkedComponents = components.filter(
    component => component.isBookmarked,
  );

  const apis = RNTesterList.APIExamples.map(apiExample => ({
    ...apiExample,
    isBookmarked: bookmarks.apis.includes(apiExample.key),
    exampleType: Screens.APIS,
  }));

  const recentlyUsedAPIs = recentlyUsed.apis
    .map(recentAPIKey => apis.find(apiEample => apiEample.key === recentAPIKey))
    .filter(Boolean);

  const bookmarkedAPIs = apis.filter(apiEample => apiEample.isBookmarked);

  const examplesList: ExamplesList = {
    [Screens.COMPONENTS]: [
      {
        key: 'RECENT_COMPONENTS',
        data: recentlyUsedComponents,
        title: 'Recently Viewed',
      },
      {
        key: 'COMPONENTS',
        data: components,
        title: 'Components',
      },
    ],
    [Screens.APIS]: [
      {
        key: 'RECENT_APIS',
        data: recentlyUsedAPIs,
        title: 'Recently viewed',
      },
      {
        key: 'APIS',
        data: apis,
        title: 'APIs',
      },
    ],
    [Screens.BOOKMARKS]: [
      {
        key: 'COMPONENTS',
        data: bookmarkedComponents,
        title: 'Components',
      },
      {
        key: 'APIS',
        data: bookmarkedAPIs,
        title: 'APIs',
      },
    ],
  };

  return filterEmptySections(examplesList);
};

export const getInitialStateFromAsyncStorage = async (
  storageKey: string,
): Promise<RNTesterState> => {
  const initialStateString = await AsyncStorage.getItem(storageKey);

  if (!initialStateString) {
    return {
      openExample: null,
      screen: Screens.COMPONENTS,
      bookmarks: {components: [], apis: []},
      recentlyUsed: {components: [], apis: []},
    };
  } else {
    return JSON.parse(initialStateString);
  }
};
