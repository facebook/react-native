export const RNTesterActionsType = {
  'INIT_FROM_STORAGE': 'INIT_FROM_STORAGE',
  'NAVBAR_PRESS': 'NAVBAR_PRESS',
  'EXAMPLE_CARD_PRESS': 'EXAMPLE_CARD_PRESS',
  'BOOKMARK_PRESS': 'BOOKMARK_PRESS',
  'BACK_BUTTON_PRESS': 'BACK_BUTTON_PRESS',
};

const getUpdatedBookmarks = ({exampleType, key, bookmarks}) => {
  const updatedBookmarks = {...bookmarks};
  if (bookmarks[exampleType].includes(key)) {
    updatedBookmarks[exampleType] = bookmarks[exampleType].filter(
      k => k !== key,
    );
  } else {
    updatedBookmarks[exampleType].push(key);
  }
  return updatedBookmarks;
};

const getUpdatedRecentlyUsed = ({exampleType, key, recentlyUsed}) => {
  const updatedRecentlyUsed = {...recentlyUsed};

  let existingKeys = updatedRecentlyUsed[exampleType];

  if (existingKeys.includes(key)) {
    existingKeys = existingKeys.filter(k => k !== key);
  }
  existingKeys.unshift(key);

  updatedRecentlyUsed[exampleType] = existingKeys.slice(0, 5);

  return updatedRecentlyUsed;
};

export const RNTesterReducer = (state, action) => {
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
        recentlyUsed: getUpdatedRecentlyUsed({exampleType: action.data.exampleType, key: action.data.key, recentlyUsed: state.recentlyUsed}),
      };
    case RNTesterActionsType.BOOKMARK_PRESS:
      return {
        ...state,
        bookmarks: getUpdatedBookmarks({exampleType: action.data.exampleType, key: action.data.key, bookmarks: state.bookmarks}),
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
