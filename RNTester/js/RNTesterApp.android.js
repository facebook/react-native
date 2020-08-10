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
const RNtesterBookmarkList = require('./components/RNTesterBookmarkList');
const RNTesterList = require('./utils/RNTesterList');
const RNTesterNavigationReducer = require('./utils/RNTesterNavigationReducer');
const React = require('react');
const URIActionMap = require('./utils/URIActionMap');
const RNTesterNavBar = require('./components/RNTesterNavbar');

// const nativeImageSource = require('react-native');

const {
  AppRegistry,
  AsyncStorage,
  BackHandler,
  Linking,
  StyleSheet,
  Text,
  UIManager,
  useColorScheme,
  View,
} = require('react-native');

import type {RNTesterExample} from './types/RNTesterTypes';
import type {RNTesterNavigationState} from './utils/RNTesterNavigationReducer';
import {RNTesterThemeContext, themes} from './components/RNTesterTheme';
import {
  RNTesterBookmarkContext,
  bookmarks,
} from './components/RNTesterBookmark';

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

type Props = {exampleFromAppetizeParams?: ?string, ...};

const APP_STATE_KEY = 'RNTesterAppState.v2';

const Header = ({
  title,
}: {
  title: string,
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
        <Header title={title} />
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
  const exampleTitle = screen == 'component' ? "Component Store" : "API Store"
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

const RNTesterBookmarkListViaHook = ({
  title,
  bookmark,
  onNavigate,
}: {
  title: string,
  onNavigate?: () => mixed,
  ...
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? themes.dark : themes.light;
  return (
    <RNTesterThemeContext.Provider value={theme}>
      <RNTesterBookmarkContext.Provider value={bookmark}>
        <View style={styles.container}>
          <Header title="Bookmarks" />
          <RNtesterBookmarkList onNavigate={onNavigate} />
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
      AddApi: (apiName, api) => {
        const stateApi = Object.assign({}, this.state.Api);
        stateApi[apiName] = api;
        this.setState({
          Api: stateApi,
        });
        AsyncStorage.setItem('Api', JSON.stringify(stateApi));
      },
      AddComponent: (componentName, component) => {
        const stateComponent = Object.assign({}, this.state.Components);
        stateComponent[componentName] = component;
        this.setState({
          Components: stateComponent,
        });
        AsyncStorage.setItem('Components', JSON.stringify(stateComponent));
      },
      RemoveApi: apiName => {
        const stateApi = Object.assign({}, this.state.Api);
        delete stateApi[apiName];
        this.setState({
          Api: stateApi,
        });
        AsyncStorage.setItem('Api', JSON.stringify(stateApi));
      },
      RemoveComponent: componentName => {
        const stateComponent = Object.assign({}, this.state.Components);
        delete stateComponent[componentName];
        this.setState({
          Components: stateComponent,
        });
        AsyncStorage.setItem('Components', JSON.stringify(stateComponent));
      },
      checkBookmark: (title, key) => {
        if (key === 'APIS' || key === 'RECENT_APIS') {
          return this.state.Api[title] === undefined;
        }
        return this.state.Components[title] === undefined;
      },
    };
  }
  UNSAFE_componentWillMount() {
    BackHandler.addEventListener('hardwareBackPress', () =>
      this._handleBackButtonPress(this.state.screen),
    );
  }

  componentDidMount() {
    Linking.getInitialURL().then(url => {
      AsyncStorage.getItem(APP_STATE_KEY, (err, storedString) => {
        const exampleAction = URIActionMap(
          this.props.exampleFromAppetizeParams,
        );
        const urlAction = URIActionMap(url);
        const launchAction = exampleAction || urlAction;
        if (err || !storedString) {
          const initialAction = launchAction || {type: 'RNTesterListAction'};
          this.setState(RNTesterNavigationReducer(null, initialAction));
          return;
        }
        const storedState = JSON.parse(storedString);
        if (launchAction) {
          this.setState(RNTesterNavigationReducer(storedState, launchAction));
          return;
        }
        this.setState({
          openExample: storedState.openExample,
        });
      });
    });
    AsyncStorage.getItem('Components', (err, storedString) => {
      if (err || !storedString) {
        return;
      }
      const components = JSON.parse(storedString);
      this.setState({
        Components: components,
      });
    });
    AsyncStorage.getItem('Api', (err, storedString) => {
      if (err || !storedString) {
        return;
      }
      const api = JSON.parse(storedString);
      this.setState({
        Api: api,
      });
    });
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
            <RNTesterNavBar screen={this.state.screen} onNavigate={this._handleAction} />
          </View>
      </View>
    );
  }

  _renderApp(bookmark) {
    const {openExample, screen} = this.state;

    if (screen === 'bookmark' && !openExample) {
      return (
        <RNTesterBookmarkListViaHook
          title={'RNTester'}
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
           * when making Flow check .android.js files. */
          bookmark={bookmark}
          onNavigate={this._handleAction}
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
