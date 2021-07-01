/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import {
  BackHandler,
  StyleSheet,
  useColorScheme,
  View,
  LogBox,
} from 'react-native';
import * as React from 'react';

import RNTesterModuleContainer from './components/RNTesterModuleContainer';
import RNTesterModuleList from './components/RNTesterModuleList';
import RNTesterNavBar from './components/RNTesterNavbar';
import RNTesterList from './utils/RNTesterList';
import {
  Screens,
  initialState,
  getExamplesListWithBookmarksAndRecentlyUsed,
  getInitialStateFromAsyncStorage,
} from './utils/testerStateUtils';
import {useAsyncStorageReducer} from './utils/useAsyncStorageReducer';
import {RNTesterReducer, RNTesterActionsType} from './utils/RNTesterReducer';
import {RNTesterThemeContext, themes} from './components/RNTesterTheme';
import {Header} from './components/RNTesterHeader';
import {RNTesterEmptyBookmarksState} from './components/RNTesterEmptyBookmarksState';

import type {RNTesterTheme} from './components/RNTesterTheme';
import type {ExamplesList} from './types/RNTesterTypes';

const APP_STATE_KEY = 'RNTesterAppState.v3';

// RNTester App currently uses AsyncStorage from react-native for storing navigation state
// and bookmark items.
// TODO: Vendor AsyncStorage or create our own.
LogBox.ignoreLogs([/AsyncStorage has been extracted from react-native/]);

const DisplayIfVisible = ({isVisible, children}) =>
  isVisible ? (
    <View style={[styles.container, !isVisible && styles.hidden]}>
      {children}
    </View>
  ) : null;

type ExampleListsContainerProps = $ReadOnly<{|
  theme: RNTesterTheme,
  screen: string,
  title: string,
  examplesList: ExamplesList,
  toggleBookmark: (args: {exampleType: string, key: string}) => mixed,
  handleModuleCardPress: (args: {exampleType: string, key: string}) => mixed,
  isVisible: boolean,
|}>;

const ModuleListsContainer = ({
  theme,
  screen,
  title,
  examplesList,
  toggleBookmark,
  handleModuleCardPress,
  isVisible,
}: ExampleListsContainerProps) => {
  const isBookmarkEmpty = examplesList.bookmarks.length === 0;

  return (
    <DisplayIfVisible isVisible={isVisible}>
      <Header title={title} theme={theme} />
      <DisplayIfVisible isVisible={screen === Screens.COMPONENTS}>
        <RNTesterModuleList
          sections={examplesList.components}
          toggleBookmark={toggleBookmark}
          handleModuleCardPress={handleModuleCardPress}
        />
      </DisplayIfVisible>
      <DisplayIfVisible isVisible={screen === Screens.APIS}>
        <RNTesterModuleList
          sections={examplesList.apis}
          toggleBookmark={toggleBookmark}
          handleModuleCardPress={handleModuleCardPress}
        />
      </DisplayIfVisible>
      <DisplayIfVisible isVisible={screen === Screens.BOOKMARKS}>
        {isBookmarkEmpty ? (
          <RNTesterEmptyBookmarksState />
        ) : (
          <RNTesterModuleList
            sections={examplesList.bookmarks}
            toggleBookmark={toggleBookmark}
            handleModuleCardPress={handleModuleCardPress}
          />
        )}
      </DisplayIfVisible>
    </DisplayIfVisible>
  );
};

const RNTesterApp = (): React.Node => {
  const [state, dispatch] = useAsyncStorageReducer(
    RNTesterReducer,
    initialState,
    APP_STATE_KEY,
  );
  const colorScheme = useColorScheme();

  const {
    activeModuleKey,
    activeModuleExampleKey,
    screen,
    bookmarks,
    recentlyUsed,
  } = state;

  React.useEffect(() => {
    getInitialStateFromAsyncStorage(APP_STATE_KEY).then(
      initialStateFromStorage => {
        dispatch({
          type: RNTesterActionsType.INIT_FROM_STORAGE,
          data: initialStateFromStorage,
        });
      },
    );
  }, [dispatch]);

  const examplesList = React.useMemo(
    () =>
      getExamplesListWithBookmarksAndRecentlyUsed({bookmarks, recentlyUsed}),
    [bookmarks, recentlyUsed],
  );

  const handleBackPress = React.useCallback(() => {
    if (activeModuleKey != null) {
      dispatch({type: RNTesterActionsType.BACK_BUTTON_PRESS});
    }
  }, [dispatch, activeModuleKey]);

  // Setup hardware back button press listener
  React.useEffect(() => {
    const handleHardwareBackPress = () => {
      if (activeModuleKey) {
        handleBackPress();
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', handleHardwareBackPress);

    return () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        handleHardwareBackPress,
      );
    };
  }, [activeModuleKey, handleBackPress]);

  const handleModuleCardPress = React.useCallback(
    ({exampleType, key}) => {
      dispatch({
        type: RNTesterActionsType.MODULE_CARD_PRESS,
        data: {exampleType, key},
      });
    },
    [dispatch],
  );

  const handleModuleExampleCardPress = React.useCallback(
    exampleName => {
      dispatch({
        type: RNTesterActionsType.EXAMPLE_CARD_PRESS,
        data: {key: exampleName},
      });
    },
    [dispatch],
  );

  const toggleBookmark = React.useCallback(
    ({exampleType, key}) => {
      dispatch({
        type: RNTesterActionsType.BOOKMARK_PRESS,
        data: {exampleType, key},
      });
    },
    [dispatch],
  );

  const handleNavBarPress = React.useCallback(
    args => {
      dispatch({
        type: RNTesterActionsType.NAVBAR_PRESS,
        data: {screen: args.screen},
      });
    },
    [dispatch],
  );

  const theme = colorScheme === 'dark' ? themes.dark : themes.light;

  if (examplesList === null) {
    return null;
  }

  const activeModule =
    activeModuleKey != null ? RNTesterList.Modules[activeModuleKey] : null;
  const activeModuleExample =
    activeModuleExampleKey != null
      ? activeModule?.examples.find(e => e.name === activeModuleExampleKey)
      : null;
  const title = Screens.COMPONENTS
    ? 'Components'
    : Screens.APIS
    ? 'APIs'
    : 'Bookmarks';

  return (
    <RNTesterThemeContext.Provider value={theme}>
      {activeModule != null ? (
        <View style={styles.container}>
          <Header
            onBack={handleBackPress}
            title={title}
            theme={theme}
            documentationURL={activeModule.documentationURL}
          />
          <RNTesterModuleContainer
            module={activeModule}
            example={activeModuleExample}
            onExampleCardPress={handleModuleExampleCardPress}
          />
        </View>
      ) : (
        <ModuleListsContainer
          isVisible={!activeModule}
          screen={screen || Screens.COMPONENTS}
          title={title}
          theme={theme}
          examplesList={examplesList}
          handleModuleCardPress={handleModuleCardPress}
          toggleBookmark={toggleBookmark}
        />
      )}
      <View style={styles.bottomNavbar}>
        <RNTesterNavBar
          screen={screen || Screens.COMPONENTS}
          isExamplePageOpen={!!activeModule}
          handleNavBarPress={handleNavBarPress}
        />
      </View>
    </RNTesterThemeContext.Provider>
  );
};

export default RNTesterApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomNavbar: {
    bottom: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
  },
  hidden: {
    display: 'none',
  },
});
