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
const RNTesterList = require('./utils/RNTesterList');
const RNTesterNavigationReducer = require('./utils/RNTesterNavigationReducer');
const React = require('react');
const RNTesterNavBar = require('./components/RNTesterNavbar');

const {
  AppRegistry,
  AsyncStorage,
  BackHandler,
  StyleSheet,
  Text,
  UIManager,
  useColorScheme,
  View,
  LogBox,
} = require('react-native');

import type {RNTesterExample} from './types/RNTesterTypes';
import type {RNTesterNavigationState} from './utils/RNTesterNavigationReducer';
import {RNTesterThemeContext, themes} from './components/RNTesterTheme';
import RNTesterDocumentationURL from './components/RNTesterDocumentationURL';
import {
  RNTesterBookmarkContext,
  bookmarks,
} from './components/RNTesterBookmark';
import type {RNTesterBookmark} from './components/RNTesterBookmark';

import {
  initializeAsyncStore,
  addApi,
  addComponent,
  removeApi,
  removeComponent,
  checkBookmarks,
  updateRecentlyViewedList,
} from './utils/RNTesterAsyncStorageAbstraction';

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

type Props = {exampleFromAppetizeParams?: ?string, ...};

const APP_STATE_KEY = 'RNTesterAppState.v2';

const Header = ({
  title,
  documentationURL,
}: {
  title: string,
  documentationURL?: string,
  ...
}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <View style={[styles.toolbar, {backgroundColor: '#F3F8FF'}]}>
          <View style={styles.toolbarCenter}>
            <Text style={[styles.title, {color: theme.LabelColor}]}>
              {title}
            </Text>
            {documentationURL && (
              <RNTesterDocumentationURL documentationURL={documentationURL} />
            )}
          </View>
        </View>
      );
    }}
  </RNTesterThemeContext.Consumer>
);

const RNTesterExampleContainerViaHook = ({
  title,
  module,
  exampleRef,
}: {
  title: string,
  module: RNTesterExample,
  exampleRef: () => void,
  ...
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? themes.dark : themes.light;
  return (
    <RNTesterThemeContext.Provider value={theme}>
      <View style={styles.container}>
        <Header title={title} documentationURL={module.documentationURL} />
        <RNTesterExampleContainer module={module} ref={exampleRef} />
      </View>
    </RNTesterThemeContext.Provider>
  );
};

const RNTesterExampleListViaHook = ({
  title,
  onNavigate,
  UpdateRecentlyViewedList,
  recentComponents,
  recentApis,
  bookmark,
  list,
  screen,
}: {
  title: string,
  screen: string,
  onNavigate?: () => mixed,
  UpdateRecentlyViewedList?: (item: RNTesterExample, key: string) => mixed,
  recentComponents: Array<RNTesterExample>,
  recentApis: Array<RNTesterExample>,
  list: {
    ComponentExamples: Array<RNTesterExample>,
    APIExamples: Array<RNTesterExample>,
    ...
  },
  bookmark: RNTesterBookmark,
  ...
}) => {
  const colorScheme = useColorScheme();
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
        <View style={styles.container}>
          <Header title={exampleTitle} />
          <RNTesterExampleList
            onNavigate={onNavigate}
            recentComponents={recentComponents}
            recentApis={recentApis}
            updateRecentlyViewedList={UpdateRecentlyViewedList}
            list={list}
            screen={screen}
          />
        </View>
      </RNTesterBookmarkContext.Provider>
    </RNTesterThemeContext.Provider>
  );
};

class RNTesterApp extends React.Component<Props, RNTesterNavigationState> {
  constructor() {
    super();

    // RNTester App currently uses Async Storage from react-native for storing navigation state
    // and bookmark items.
    // TODO: Add Native Async Storage Module in RNTester
    LogBox.ignoreLogs([new RegExp('has been extracted from react-native')]);

    this.state = {
      openExample: null,
      Components: bookmarks.Components,
      Api: bookmarks.Api,
      recentComponents: [],
      recentApis: [],
      screen: 'component',
      AddApi: (apiName, api) => addApi(apiName, api, this),
      AddComponent: (componentName, component) =>
        addComponent(componentName, component, this),
      RemoveApi: apiName => removeApi(apiName, this),
      RemoveComponent: componentName => removeComponent(componentName, this),
      checkBookmark: (title, key) => checkBookmarks(title, key, this),
      updateRecentlyViewedList: (item, key) =>
        updateRecentlyViewedList(item, key, this),
    };
  }
  UNSAFE_componentWillMount() {
    BackHandler.addEventListener('hardwareBackPress', () =>
      this._handleBackButtonPress(this.state.screen),
    );
  }

  componentDidMount() {
    initializeAsyncStore(this);
  }

  render(): React.Node {
    if (!this.state) {
      return null;
    }
    return (
      <View style={styles.container}>
        {this._renderApp({
          Components: this.state.Components,
          Api: this.state.Api,
          AddApi: this.state.AddApi,
          AddComponent: this.state.AddComponent,
          RemoveApi: this.state.RemoveApi,
          RemoveComponent: this.state.RemoveComponent,
          checkBookmark: this.state.checkBookmark,
        })}
        <View style={styles.bottomNavbar}>
          <RNTesterNavBar
            screen={this.state.screen}
            onNavigate={this._handleAction}
          />
        </View>
      </View>
    );
  }

  _renderApp(bookmark) {
    const {openExample, screen} = this.state;

    if (openExample) {
      const ExampleModule = RNTesterList.Modules[openExample];
      if (ExampleModule.external) {
        return (
          <ExampleModule
            onExampleExit={() => {
              this._handleAction(RNTesterActions.Back(screen));
            }}
            ref={example => {
              /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue
               * was found when making Flow check .android.js files. */
              this._exampleRef = example;
            }}
          />
        );
      } else if (ExampleModule) {
        return (
          <>
            <RNTesterExampleContainerViaHook
              /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
               * when making Flow check .android.js files. */
              title={ExampleModule.title}
              module={ExampleModule}
              exampleRef={example => {
                /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue
                 * was found when making Flow check .android.js files. */
                this._exampleRef = example;
              }}
            />
          </>
        );
      }
    }

    return (
      <RNTesterExampleListViaHook
        key={screen}
        title={'RNTester'}
        /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
         * when making Flow check .android.js files. */
        onNavigate={this._handleAction}
        UpdateRecentlyViewedList={this.state.updateRecentlyViewedList}
        recentComponents={this.state.recentComponents}
        recentApis={this.state.recentApis}
        bookmark={bookmark}
        list={RNTesterList}
        screen={screen}
      />
    );
  }

  _handleAction = (action: Object): boolean => {
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    const newState = RNTesterNavigationReducer(this.state, action);
    if (this.state !== newState) {
      this.setState(newState, () =>
        AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(this.state)),
      );
      return true;
    }
    return false;
  };

  _handleBackButtonPress = screen => {
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    if (
      /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
       * when making Flow check .android.js files. */
      this._exampleRef &&
      /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
       * when making Flow check .android.js files. */
      this._exampleRef.handleBackAction &&
      /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
       * when making Flow check .android.js files. */
      this._exampleRef.handleBackAction()
    ) {
      return true;
    }
    return this._handleAction(RNTesterActions.Back(screen));
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    height: 56,
  },
  toolbarLeft: {
    marginTop: 2,
  },
  toolbarCenter: {
    flex: 1,
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomNavbar: {
    bottom: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
  },
});

AppRegistry.registerComponent('RNTesterApp', () => RNTesterApp);

module.exports = RNTesterApp;
