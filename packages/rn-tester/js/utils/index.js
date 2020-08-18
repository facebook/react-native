import {AsyncStorage} from 'react-native';

import RNTesterList from './RNTesterList';

export const Screens = {
  COMPONENTS: 'components',
  APIS: 'apis',
  BOOKMARKS: 'bookmarks',
};

export const initialState = {
  openExample: null,
  screen: null,
  bookmarks: null,
  recentlyUsed: null,
};

const filterEmptySections = examplesList => {
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
}) => {
  // Return early if state has not been initialized from storage
  if (!bookmarks || !recentlyUsed) {
    return null;
  }

  const components = RNTesterList.ComponentExamples.map(c => ({
    ...c,
    isBookmarked: bookmarks.components.includes(c.key),
    exampleType: Screens.COMPONENTS,
  }));

  const recentlyUsedComponents = recentlyUsed.components.map(k =>
    components.find(c => c.key === k),
  );

  const bookmarkedComponents = components.filter(c => c.isBookmarked);

  const apis = RNTesterList.APIExamples.map(c => ({
    ...c,
    isBookmarked: bookmarks.apis.includes(c.key),
    exampleType: Screens.APIS,
  }));

  const recentlyUsedAPIs = recentlyUsed.apis.map(k =>
    apis.find(c => c.key === k),
  );

  const bookmarkedAPIs = apis.filter(c => c.isBookmarked);

  const examplesList = {
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

export const getInitialStateFromAsyncStorage = async storageKey => {
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
