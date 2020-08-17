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
const URIActionMap = require('./utils/URIActionMap');
const RNTesterNavBar = require('./components/RNTesterNavbar');

const {
  AppRegistry,
  AsyncStorage,
  BackHandler,
  StyleSheet,
  Text,
  Linking,
  UIManager,
  useColorScheme,
  View,
  TouchableOpacity,
  Image,
} = require('react-native');

import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser';

import type {RNTesterExample} from './types/RNTesterTypes';
import type {RNTesterNavigationState} from './utils/RNTesterNavigationReducer';
import {RNTesterThemeContext, themes} from './components/RNTesterTheme';
import {
  RNTesterBookmarkContext,
  bookmarks,
} from './components/RNTesterBookmark';

import {
  initializeAsyncStore,
  addApi,
  addComponent,
  removeApi,
  removeComponent,
  checkBookmarks
} from './utils/RNTesterAsyncStorageAbstraction';

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

type Props = {exampleFromAppetizeParams?: ?string, ...};

const APP_STATE_KEY = 'RNTesterAppState.v2';

const Header = ({title, documentationURL}: {title: string, ...}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <View style={[styles.toolbar, {backgroundColor: '#F3F8FF'}]}>
          <View style={styles.toolbarCenter}>
            <Text style={[styles.title, {color: theme.LabelColor}]}>
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
  bookmark,
  list,
  screen,
}: {
  title: string,
  onNavigate?: () => mixed,
  list: {
    ComponentExamples: Array<RNTesterExample>,
    APIExamples: Array<RNTesterExample>,
    ...
  },
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
    this.state = {
      openExample: null,
      Components: bookmarks.Components,
      Api: bookmarks.Api,
      screen: 'component',
      AddApi: (apiName, api) => addApi(apiName, api, this),
      AddComponent: (componentName, component) => addComponent(componentName, component, this),
      RemoveApi: (apiName) => removeApi(apiName, this),
      RemoveComponent: (componentName) => removeComponent(componentName, this),
      checkBookmark: (title, key) => checkBookmarks(title, key, this),
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

    if (screen === 'bookmark' && !openExample) {
      return (
        <RNTesterExampleListViaHook
          title={'RNTester'}
          key={screen}
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
           * when making Flow check .android.js files. */
          bookmark={bookmark}
          onNavigate={this._handleAction}
          list={RNTesterList}
          screen={screen}
        />
      );
    } else if (openExample) {
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
