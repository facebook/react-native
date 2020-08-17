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

const RNTesterActions = require('./utils/RNTesterActions');
const RNTesterExampleContainer = require('./components/RNTesterExampleContainer');
const RNTesterExampleList = require('./components/RNTesterExampleList');
const RNTesterList = require('./utils/RNTesterList.ios');
const RNTesterNavigationReducer = require('./utils/RNTesterNavigationReducer');
const React = require('react');
const SnapshotViewIOS = require('./examples/Snapshot/SnapshotViewIOS.ios');
const URIActionMap = require('./utils/URIActionMap');
const RNTesterNavbar = require('./components/RNTesterNavbar');

const {
  AppRegistry,
  AsyncStorage,
  BackHandler,
  Button,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  LogBox,
  TouchableOpacity,
  Image,
} = require('react-native');

import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser';

import type {RNTesterExample} from './types/RNTesterTypes';
import type {RNTesterAction} from './utils/RNTesterActions';
import type {RNTesterNavigationState} from './utils/RNTesterNavigationReducer';
import {RNTesterThemeContext, themes} from './components/RNTesterTheme';
import type {ColorSchemeName} from 'react-native/Libraries/Utilities/NativeAppearance';
import {
  RNTesterBookmarkContext,
  bookmarks,
} from './components/RNTesterBookmark';

type Props = {exampleFromAppetizeParams?: ?string, ...};

import {
  initializeAsyncStore,
  addApi,
  addComponent,
  removeApi,
  removeComponent,
  checkBookmarks,
  updateRecentlyViewedList
} from './utils/RNTesterAsyncStorageAbstraction';

const APP_STATE_KEY = 'RNTesterAppState.v2';

const Header = ({
  onBack,
  title,
  documentationURL,
}: {
  onBack?: () => mixed,
  title: string,
  documentationURL: string,
  ...
}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <SafeAreaView
          style={[
            styles.headerContainer,
            {
              borderBottomColor: theme.SeparatorColor,
              backgroundColor: theme.TertiarySystemBackgroundColor,
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={{...styles.title, ...{color: theme.LabelColor}}}>
                {title}
              </Text>
              {documentationURL && (
                <TouchableOpacity
                  style={{
                    textDecorationLine: 'underline',
                    position: 'absolute',
                    bottom: 3,
                    right: 25,
                  }}
                  onPress={() => openURLInBrowser(documentationURL)}>
                  <Image
                    source={require('./assets/documentation.png')}
                    style={{width: 25, height: 25}}
                  />
                </TouchableOpacity>
              )}
            </View>
            {onBack && (
              <View>
                <Button
                  title="Back"
                  onPress={onBack}
                  color={Platform.select({
                    ios: theme.LinkColor,
                    default: undefined,
                  })}
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      );
    }}
  </RNTesterThemeContext.Consumer>
);

const RNTesterExampleContainerViaHook = ({
  onBack,
  title,
  module,
}: {
  onBack?: () => mixed,
  title: string,
  module: RNTesterExample,
  ...
}) => {
  const colorScheme: ?ColorSchemeName = useColorScheme();
  const theme = colorScheme === 'dark' ? themes.dark : themes.light;
  return (
    <RNTesterThemeContext.Provider value={theme}>
      <View style={styles.exampleContainer}>
        <Header
          title={title}
          onBack={onBack}
          documentationURL={module.documentationURL}
        />
        <RNTesterExampleContainer module={module} />
      </View>
    </RNTesterThemeContext.Provider>
  );
};

const RNTesterExampleListViaHook = ({
  onNavigate,
  updateRecentlyViewedList,
  recentComponents,
  recentApis,
  bookmark,
  list,
  screen,
}: {
  onNavigate?: () => mixed,
  updateRecentlyViewedList?: () => mixed,
  recentComponents: Array<RNTesterExample>,
  recentApis: Array<RNTesterExample>,
  list: {
    ComponentExamples: Array<RNTesterExample>,
    APIExamples: Array<RNTesterExample>,
    ...
  },
  ...
}) => {
  const colorScheme: ?ColorSchemeName = useColorScheme();
  const theme = colorScheme === 'dark' ? themes.dark : themes.light;
  const exampleTitle =
    screen === 'component'
      ? 'Component Store'
      : screen === 'api'
      ? 'API Store'
      : 'Bookmarks';
  return (
    <RNTesterThemeContext.Provider value={theme}>
      <RNTesterBookmarkContext.Provider value={bookmark}>
        <View style={styles.exampleContainer}>
          <Header title={exampleTitle} />
          <RNTesterExampleList
            onNavigate={onNavigate}
            recentComponents={recentComponents}
            recentApis={recentApis}
            updateRecentlyViewedList={updateRecentlyViewedList}
            list={list}
            screen={screen}
          />
        </View>
      </RNTesterBookmarkContext.Provider>
    </RNTesterThemeContext.Provider>
  );
};

class RNTesterApp extends React.Component<Props, RNTesterNavigationState> {
  _mounted: boolean;

  constructor() {
    super();
    this.state = {
      openExample: null,
      screen: 'component',
      Components: bookmarks.Components,
      Api: bookmarks.Api,
      recentComponents: [],
      recentApis: [],
      AddApi: (apiName, api) => addApi(apiName, api, this),
      AddComponent: (componentName, component) => addComponent(componentName, component, this),
      RemoveApi: (apiName) => removeApi(apiName, this),
      RemoveComponent: (componentName) => removeComponent(componentName, this),
      checkBookmark: (title,key) => checkBookmarks(title, key, this),
      updateRecentlyViewedList: (item, key) => updateRecentlyViewedList(item, key, this),
    };
  }

  UNSAFE_componentWillMount() {
    BackHandler.addEventListener('hardwareBackPress', this._handleBack);
  }

  componentDidMount() {
    initializeAsyncStore(this);
  }

  _handleBack = () => {
    this._handleAction(RNTesterActions.Back(this.state.screen));
  };

  _handleAction = (action: ?RNTesterAction) => {
    if (!action) {
      return;
    }
    const newState = RNTesterNavigationReducer(this.state, action);
    if (this.state !== newState) {
      // syncing the app screens over async storage
      this.setState(newState, () =>
        AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(this.state)),
      );
    }
  };

  render(): React.Node | null {
    const bookmark = {
      Components: this.state.Components,
      Api: this.state.Api,
      AddApi: this.state.AddApi,
      AddComponent: this.state.AddComponent,
      RemoveApi: this.state.RemoveApi,
      RemoveComponent: this.state.RemoveComponent,
      checkBookmark: this.state.checkBookmark,
    };
    if (!this.state) {
      return null;
    }
    if (this.state.openExample) {
      const Component = RNTesterList.Modules[this.state.openExample];
      if (Component && Component.external) {
        return <Component onExampleExit={this._handleBack} />;
      } else {
        return (
          <>
            <RNTesterExampleContainerViaHook
              onBack={this._handleBack}
              title={Component.title}
              module={Component}
            />
            <View style={styles.bottomNavbar}>
              <RNTesterNavbar onNavigate={this._handleAction} />
            </View>
          </>
        );
      }
    } 
    return (
      <>
        <RNTesterExampleListViaHook
          key={this.state.screen}
          title={'RNTester'}
          onNavigate={this._handleAction}
          updateRecentlyViewedList={this.state.updateRecentlyViewedList}
          recentComponents={this.state.recentComponents}
          recentApis={this.state.recentApis}
          bookmark={bookmark}
          list={RNTesterList}
          screen={this.state.screen}
        />
        <View style={styles.bottomNavbar}>
          <RNTesterNavbar
            screen={this.state.screen}
            onNavigate={this._handleAction}
          />
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    height: 40,
    flexDirection: 'row',
  },
  headerCenter: {
    flex: 1,
    position: 'absolute',
    top: 7,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  exampleContainer: {
    flex: 1,
  },
  bottomNavbar: {
    bottom: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
  },
});

AppRegistry.registerComponent('SetPropertiesExampleApp', () =>
  require('./examples/SetPropertiesExample/SetPropertiesExampleApp'),
);
AppRegistry.registerComponent('RootViewSizeFlexibilityExampleApp', () =>
  require('./examples/RootViewSizeFlexibilityExample/RootViewSizeFlexibilityExampleApp'),
);
AppRegistry.registerComponent('RNTesterApp', () => RNTesterApp);

// Register suitable examples for snapshot tests
RNTesterList.ComponentExamples.concat(RNTesterList.APIExamples).forEach(
  (Example: RNTesterExample) => {
    const ExampleModule = Example.module;
    if (ExampleModule.displayName) {
      class Snapshotter extends React.Component<{...}> {
        render() {
          return (
            <SnapshotViewIOS>
              <RNTesterExampleContainer module={ExampleModule} />
            </SnapshotViewIOS>
          );
        }
      }

      AppRegistry.registerComponent(
        ExampleModule.displayName,
        () => Snapshotter,
      );
    }
  },
);

module.exports = RNTesterApp;
