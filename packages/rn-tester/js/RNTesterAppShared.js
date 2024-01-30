/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {RNTesterModuleInfo} from './types/RNTesterTypes';

import RNTesterModuleContainer from './components/RNTesterModuleContainer';
import RNTesterModuleList from './components/RNTesterModuleList';
import RNTesterNavBar, {navBarHeight} from './components/RNTesterNavbar';
import {RNTesterThemeContext, themes} from './components/RNTesterTheme';
import RNTTitleBar from './components/RNTTitleBar';
import RNTesterList from './utils/RNTesterList';
import {
  RNTesterNavigationActionsType,
  RNTesterNavigationReducer,
} from './utils/RNTesterNavigationReducer';
import {
  Screens,
  getExamplesListWithRecentlyUsed,
  initialNavigationState,
} from './utils/testerStateUtils';
import * as React from 'react';
import {
  BackHandler,
  Linking,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';

// RNTester App currently uses in memory storage for storing navigation state

const RNTesterApp = ({
  testList,
}: {
  testList?: {
    components?: Array<RNTesterModuleInfo>,
    apis?: Array<RNTesterModuleInfo>,
  },
}): React.Node => {
  const [state, dispatch] = React.useReducer(
    RNTesterNavigationReducer,
    initialNavigationState,
  );
  const colorScheme = useColorScheme();

  const {
    activeModuleKey,
    activeModuleTitle,
    activeModuleExampleKey,
    screen,
    recentlyUsed,
  } = state;

  const examplesList = React.useMemo(
    () => getExamplesListWithRecentlyUsed({recentlyUsed, testList}),
    [recentlyUsed, testList],
  );

  const handleBackPress = React.useCallback(() => {
    if (activeModuleKey != null) {
      dispatch({type: RNTesterNavigationActionsType.BACK_BUTTON_PRESS});
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
    ({exampleType, key, title}: any) => {
      dispatch({
        type: RNTesterNavigationActionsType.MODULE_CARD_PRESS,
        data: {exampleType, key, title},
      });
    },
    [dispatch],
  );

  const handleModuleExampleCardPress = React.useCallback(
    (exampleName: string) => {
      dispatch({
        type: RNTesterNavigationActionsType.EXAMPLE_CARD_PRESS,
        data: {key: exampleName},
      });
    },
    [dispatch],
  );

  const handleNavBarPress = React.useCallback(
    (args: {screen: string}) => {
      dispatch({
        type: RNTesterNavigationActionsType.NAVBAR_PRESS,
        data: {screen: args.screen},
      });
    },
    [dispatch],
  );

  // Setup Linking event subscription
  const handleOpenUrlRequest = React.useCallback(
    ({url}: {url: string, ...}) => {
      // Supported URL pattern(s):
      // *  rntester://example/<moduleKey>
      // *  rntester://example/<moduleKey>/<exampleKey>
      const match =
        /^rntester:\/\/example\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?$/.exec(
          url,
        );
      if (!match) {
        console.warn(
          `handleOpenUrlRequest: Received unsupported URL: '${url}'`,
        );
        return;
      }

      const rawModuleKey = match[1];
      const exampleKey = match[2];

      // For tooling compatibility, allow all these variants for each module key:
      const validModuleKeys = [
        rawModuleKey,
        `${rawModuleKey}Index`,
        `${rawModuleKey}Example`,
      ].filter(k => RNTesterList.Modules[k] != null);
      if (validModuleKeys.length !== 1) {
        if (validModuleKeys.length === 0) {
          console.error(
            `handleOpenUrlRequest: Unable to find requested module with key: '${rawModuleKey}'`,
          );
        } else {
          console.error(
            `handleOpenUrlRequest: Found multiple matching module with key: '${rawModuleKey}', unable to resolve`,
          );
        }
        return;
      }

      const resolvedModuleKey = validModuleKeys[0];
      const exampleModule = RNTesterList.Modules[resolvedModuleKey];

      if (exampleKey != null) {
        const validExampleKeys = exampleModule.examples.filter(
          e => e.name === exampleKey,
        );
        if (validExampleKeys.length !== 1) {
          if (validExampleKeys.length === 0) {
            console.error(
              `handleOpenUrlRequest: Unable to find requested example with key: '${exampleKey}' within module: '${resolvedModuleKey}'`,
            );
          } else {
            console.error(
              `handleOpenUrlRequest: Found multiple matching example with key: '${exampleKey}' within module: '${resolvedModuleKey}', unable to resolve`,
            );
          }
          return;
        }
      }

      console.log(
        `handleOpenUrlRequest: Opening module: '${resolvedModuleKey}', example: '${
          exampleKey || 'null'
        }'`,
      );

      dispatch({
        type: RNTesterNavigationActionsType.EXAMPLE_OPEN_URL_REQUEST,
        data: {
          key: resolvedModuleKey,
          title: exampleModule.title || resolvedModuleKey,
          exampleKey,
        },
      });
    },
    [dispatch],
  );
  React.useEffect(() => {
    const subscription = Linking.addEventListener('url', handleOpenUrlRequest);
    return () => subscription.remove();
  }, [handleOpenUrlRequest]);

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
  const title =
    activeModuleTitle != null
      ? activeModuleTitle
      : screen === Screens.COMPONENTS
      ? 'Components'
      : 'APIs';

  const activeExampleList =
    screen === Screens.COMPONENTS ? examplesList.components : examplesList.apis;

  return (
    <RNTesterThemeContext.Provider value={theme}>
      <RNTTitleBar
        title={title}
        theme={theme}
        onBack={activeModule ? handleBackPress : null}
        documentationURL={activeModule?.documentationURL}
      />
      <View
        style={StyleSheet.compose(styles.container, {
          backgroundColor: theme.GroupedBackgroundColor,
        })}>
        {activeModule != null ? (
          <RNTesterModuleContainer
            module={activeModule}
            example={activeModuleExample}
            onExampleCardPress={handleModuleExampleCardPress}
          />
        ) : (
          <RNTesterModuleList
            sections={activeExampleList}
            handleModuleCardPress={handleModuleCardPress}
          />
        )}
      </View>
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
    height: navBarHeight,
  },
  hidden: {
    display: 'none',
  },
});
