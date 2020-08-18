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
    case 'initialize_state_from_storage':
      return action.data;
    case 'update_screen':
      return {
        ...state,
        openExample: null,
        screen: action.data,
      };
    case 'update_open_example':
      return {
        ...state,
        openExample: action.data?.key,
        recentlyUsed: action.data
          ? getUpdatedRecentlyUsed({
              ...action.data,
              recentlyUsed: state.recentlyUsed,
            })
          : state.recentlyUsed,
      };
    case 'toggle_bookmark':
      return {
        ...state,
        bookmarks: getUpdatedBookmarks({
          ...action.data,
          bookmarks: state.bookmarks,
        }),
      };
    case 'update_recently_used':
      return {
        ...state,
        recentlyUsed: getUpdatedRecentlyUsed({
          ...action.data,
          recentlyUsed: state.recentlyUsed,
        }),
      };
    default:
      throw new Error(`Invalid action type ${action.type}`);
  }
};
