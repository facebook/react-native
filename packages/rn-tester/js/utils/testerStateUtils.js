/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {
  ComponentList,
  ExamplesList,
  RNTesterModuleInfo,
  RNTesterNavigationState,
  SectionData,
} from '../types/RNTesterTypes';

import RNTesterList from './RNTesterList';

export const Screens = {
  COMPONENTS: 'components',
  APIS: 'apis',
  BOOKMARKS: 'bookmarks',
};

export const initialNavigationState: RNTesterNavigationState = {
  activeModuleKey: null,
  activeModuleTitle: null,
  activeModuleExampleKey: null,
  screen: Screens.COMPONENTS,
  bookmarks: {components: [], apis: []},
  recentlyUsed: {components: [], apis: []},
};

const filterEmptySections = (examplesList: ExamplesList): any => {
  const filteredSections: {
    ['apis' | 'bookmarks' | 'components']: Array<
      SectionData<RNTesterModuleInfo>,
    >,
  } = {};
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

  const components = RNTesterList.Components.map(
    (componentExample): RNTesterModuleInfo => ({
      ...componentExample,
      isBookmarked: bookmarks.components.includes(componentExample.key),
      exampleType: Screens.COMPONENTS,
    }),
  );

  const recentlyUsedComponents = recentlyUsed.components
    .map(recentComponentKey =>
      components.find(component => component.key === recentComponentKey),
    )
    .filter(Boolean);

  const bookmarkedComponents = components.filter(
    component => component.isBookmarked,
  );

  const apis = RNTesterList.APIs.map((apiExample): RNTesterModuleInfo => ({
    ...apiExample,
    isBookmarked: bookmarks.apis.includes(apiExample.key),
    exampleType: Screens.APIS,
  }));

  const recentlyUsedAPIs = recentlyUsed.apis
    .map(recentAPIKey =>
      apis.find(apiExample => apiExample.key === recentAPIKey),
    )
    .filter(Boolean);

  const bookmarkedAPIs = apis.filter(apiExample => apiExample.isBookmarked);

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
