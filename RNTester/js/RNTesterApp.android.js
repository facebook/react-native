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

const nativeImageSource = require('../../Libraries/Image/nativeImageSource');

const {
  AppRegistry,
  AsyncStorage,
  BackHandler,
  Dimensions,
  DrawerLayoutAndroid,
  Image,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  UIManager,
  useColorScheme,
  View,
} = require('react-native');

import type {RNTesterExample} from './types/RNTesterTypes';
import type {RNTesterNavigationState} from './utils/RNTesterNavigationReducer';
import {RNTesterThemeContext, themes} from './components/RNTesterTheme';

UIManager.setLayoutAnimationEnabledExperimental(true);

const DRAWER_WIDTH_LEFT = 56;

type Props = {exampleFromAppetizeParams?: ?string, ...};

const APP_STATE_KEY = 'RNTesterAppState.v2';

const HEADER_NAV_ICON = nativeImageSource({
  android: 'ic_menu_black_24dp',
  width: 48,
  height: 48,
});

const Header = ({
  onPressDrawer,
  title,
}: {
  onPressDrawer?: () => mixed,
  title: string,
  ...
}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <View style={[styles.toolbar, {backgroundColor: theme.ToolbarColor}]}>
          <View style={styles.toolbarCenter}>
            <Text style={[styles.title, {color: theme.LabelColor}]}>
              {title}
            </Text>
          </View>
          <View style={styles.toolbarLeft}>
            <TouchableWithoutFeedback onPress={onPressDrawer}>
              <Image source={HEADER_NAV_ICON} />
            </TouchableWithoutFeedback>
          </View>
        </View>
      );
    }}
  </RNTesterThemeContext.Consumer>
);

const RNTesterExampleContainerViaHook = ({
  onPressDrawer,
  title,
  module,
  exampleRef,
}: {
  onPressDrawer?: () => mixed,
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
        <Header title={title} onPressDrawer={onPressDrawer} />
        <RNTesterExampleContainer module={module} ref={exampleRef} />
      </View>
    </RNTesterThemeContext.Provider>
  );
};

const RNTesterDrawerContentViaHook = ({
  onNavigate,
  list,
}: {
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
  return (
    <RNTesterThemeContext.Provider value={theme}>
      <View
        style={[
          styles.drawerContentWrapper,
          {backgroundColor: theme.SystemBackgroundColor},
        ]}>
        <RNTesterExampleList
          list={list}
          displayTitleRow={true}
          disableSearch={true}
          onNavigate={onNavigate}
        />
      </View>
    </RNTesterThemeContext.Provider>
  );
};

const RNTesterExampleListViaHook = ({
  title,
  onPressDrawer,
  onNavigate,
  list,
}: {
  title: string,
  onPressDrawer?: () => mixed,
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
  return (
    <RNTesterThemeContext.Provider value={theme}>
      <View style={styles.container}>
        <Header title={title} onPressDrawer={onPressDrawer} />
        <RNTesterExampleList onNavigate={onNavigate} list={list} />
      </View>
    </RNTesterThemeContext.Provider>
  );
};

class RNTesterApp extends React.Component<Props, RNTesterNavigationState> {
  UNSAFE_componentWillMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this._handleBackButtonPress,
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
          const initialAction = launchAction || {type: 'InitialAction'};
          this.setState(RNTesterNavigationReducer(null, initialAction));
          return;
        }
        const storedState = JSON.parse(storedString);
        if (launchAction) {
          this.setState(RNTesterNavigationReducer(storedState, launchAction));
          return;
        }
        this.setState(storedState);
      });
    });
  }

  render(): React.Node {
    if (!this.state) {
      return null;
    }
    return (
      <DrawerLayoutAndroid
        drawerPosition="left"
        drawerWidth={Dimensions.get('window').width - DRAWER_WIDTH_LEFT}
        keyboardDismissMode="on-drag"
        onDrawerOpen={() => {
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */
          this._overrideBackPressForDrawerLayout = true;
        }}
        onDrawerClose={() => {
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */
          this._overrideBackPressForDrawerLayout = false;
        }}
        ref={drawer => {
          /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */
          this.drawer = drawer;
        }}
        renderNavigationView={this._renderDrawerContent}
        statusBarBackgroundColor="#589c90">
        {this._renderApp()}
      </DrawerLayoutAndroid>
    );
  }

  _renderDrawerContent = () => {
    return (
      <RNTesterDrawerContentViaHook
        onNavigate={this._handleAction}
        list={RNTesterList}
      />
    );
  };

  _renderApp() {
    const {openExample} = this.state;

    if (openExample) {
      const ExampleModule = RNTesterList.Modules[openExample];
      if (ExampleModule.external) {
        return (
          <ExampleModule
            onExampleExit={() => {
              this._handleAction(RNTesterActions.Back());
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
          <RNTesterExampleContainerViaHook
            /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
             * when making Flow check .android.js files. */
            onPressDrawer={() => this.drawer.openDrawer()}
            title={ExampleModule.title}
            module={ExampleModule}
            exampleRef={example => {
              /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue
               * was found when making Flow check .android.js files. */
              this._exampleRef = example;
            }}
          />
        );
      }
    }

    return (
      <RNTesterExampleListViaHook
        title={'RNTester'}
        /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
         * when making Flow check .android.js files. */
        onPressDrawer={() => this.drawer.openDrawer()}
        onNavigate={this._handleAction}
        list={RNTesterList}
      />
    );
  }

  _handleAction = (action: Object): boolean => {
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    this.drawer && this.drawer.closeDrawer();
    const newState = RNTesterNavigationReducer(this.state, action);
    if (this.state !== newState) {
      this.setState(newState, () =>
        AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(this.state)),
      );
      return true;
    }
    return false;
  };

  _handleBackButtonPress = () => {
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    if (this._overrideBackPressForDrawerLayout) {
      // This hack is necessary because drawer layout provides an imperative API
      // with open and close methods. This code would be cleaner if the drawer
      // layout provided an `isOpen` prop and allowed us to pass a `onDrawerClose` handler.
      /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
       * when making Flow check .android.js files. */
      this.drawer && this.drawer.closeDrawer();
      return true;
    }
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
    return this._handleAction(RNTesterActions.Back());
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
  drawerContentWrapper: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
  },
});

AppRegistry.registerComponent('RNTesterApp', () => RNTesterApp);

module.exports = RNTesterApp;
