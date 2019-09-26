/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const Platform = require('../../Utilities/Platform');
const React = require('react');
const ReactNative = require('../../Renderer/shims/ReactNative');
const StatusBar = require('../StatusBar/StatusBar');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const UIManager = require('../../ReactNative/UIManager');
const View = require('../View/View');
const nullthrows = require('nullthrows');

const DrawerConsts = UIManager.getViewManagerConfig('AndroidDrawerLayout')
  .Constants;
const dismissKeyboard = require('../../Utilities/dismissKeyboard');
const AndroidDrawerLayoutNativeComponent = require('./AndroidDrawerLayoutNativeComponent');

const DRAWER_STATES = ['Idle', 'Dragging', 'Settling'];

import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {
  MeasureOnSuccessCallback,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
} from '../../Renderer/shims/ReactNativeTypes';

type DrawerStates = 'Idle' | 'Dragging' | 'Settling';

type DrawerStateEvent = SyntheticEvent<
  $ReadOnly<{|
    drawerState: number,
  |}>,
>;

type DrawerSlideEvent = SyntheticEvent<
  $ReadOnly<{|
    offset: number,
  |}>,
>;

type Props = $ReadOnly<{|
  /**
   * Determines whether the keyboard gets dismissed in response to a drag.
   *   - 'none' (the default), drags do not dismiss the keyboard.
   *   - 'on-drag', the keyboard is dismissed when a drag begins.
   */
  keyboardDismissMode?: ?('none' | 'on-drag'),

  /**
   * Specifies the background color of the drawer. The default value is white.
   * If you want to set the opacity of the drawer, use rgba. Example:
   *
   * ```
   * return (
   *   <DrawerLayoutAndroid drawerBackgroundColor="rgba(0,0,0,0.5)">
   *   </DrawerLayoutAndroid>
   * );
   * ```
   */
  drawerBackgroundColor: ColorValue,

  /**
   * Specifies the side of the screen from which the drawer will slide in.
   */
  drawerPosition: ?number,

  /**
   * Specifies the width of the drawer, more precisely the width of the view that be pulled in
   * from the edge of the window.
   */
  drawerWidth?: ?number,

  /**
   * Specifies the lock mode of the drawer. The drawer can be locked in 3 states:
   * - unlocked (default), meaning that the drawer will respond (open/close) to touch gestures.
   * - locked-closed, meaning that the drawer will stay closed and not respond to gestures.
   * - locked-open, meaning that the drawer will stay opened and not respond to gestures.
   * The drawer may still be opened and closed programmatically (`openDrawer`/`closeDrawer`).
   */
  drawerLockMode?: ?('unlocked' | 'locked-closed' | 'locked-open'),

  /**
   * Function called whenever there is an interaction with the navigation view.
   */
  onDrawerSlide?: ?(event: DrawerSlideEvent) => mixed,

  /**
   * Function called when the drawer state has changed. The drawer can be in 3 states:
   * - Idle, meaning there is no interaction with the navigation view happening at the time
   * - Dragging, meaning there is currently an interaction with the navigation view
   * - Settling, meaning that there was an interaction with the navigation view, and the
   * navigation view is now finishing its closing or opening animation
   */
  onDrawerStateChanged?: ?(state: DrawerStates) => mixed,

  /**
   * Function called whenever the navigation view has been opened.
   */
  onDrawerOpen?: ?() => mixed,

  /**
   * Function called whenever the navigation view has been closed.
   */
  onDrawerClose?: ?() => mixed,

  /**
   * The navigation view that will be rendered to the side of the screen and can be pulled in.
   */
  renderNavigationView: () => React.Element<any>,

  /**
   * Make the drawer take the entire screen and draw the background of the
   * status bar to allow it to open over the status bar. It will only have an
   * effect on API 21+.
   */
  statusBarBackgroundColor?: ?ColorValue,

  children?: React.Node,
  style?: ?ViewStyleProp,
|}>;

type State = {|
  statusBarBackgroundColor: ColorValue,
|};

/**
 * React component that wraps the platform `DrawerLayout` (Android only). The
 * Drawer (typically used for navigation) is rendered with `renderNavigationView`
 * and direct children are the main view (where your content goes). The navigation
 * view is initially not visible on the screen, but can be pulled in from the
 * side of the window specified by the `drawerPosition` prop and its width can
 * be set by the `drawerWidth` prop.
 *
 * Example:
 *
 * ```
 * render: function() {
 *   var navigationView = (
 *     <View style={{flex: 1, backgroundColor: '#fff'}}>
 *       <Text style={{margin: 10, fontSize: 15, textAlign: 'left'}}>I'm in the Drawer!</Text>
 *     </View>
 *   );
 *   return (
 *     <DrawerLayoutAndroid
 *       drawerWidth={300}
 *       drawerPosition={DrawerLayoutAndroid.positions.Left}
 *       renderNavigationView={() => navigationView}>
 *       <View style={{flex: 1, alignItems: 'center'}}>
 *         <Text style={{margin: 10, fontSize: 15, textAlign: 'right'}}>Hello</Text>
 *         <Text style={{margin: 10, fontSize: 15, textAlign: 'right'}}>World!</Text>
 *       </View>
 *     </DrawerLayoutAndroid>
 *   );
 * },
 * ```
 */
class DrawerLayoutAndroid extends React.Component<Props, State> {
  static positions = DrawerConsts.DrawerPosition;
  static defaultProps = {
    drawerBackgroundColor: 'white',
  };

  _nativeRef = React.createRef<Class<ReactNative.NativeComponent<Props>>>();

  state = {statusBarBackgroundColor: null};

  render() {
    const {onDrawerStateChanged, ...props} = this.props;
    const drawStatusBar =
      Platform.Version >= 21 && this.props.statusBarBackgroundColor;
    const drawerViewWrapper = (
      <View
        style={[
          styles.drawerSubview,
          {
            width: this.props.drawerWidth,
            backgroundColor: this.props.drawerBackgroundColor,
          },
        ]}
        collapsable={false}>
        {this.props.renderNavigationView()}
        {drawStatusBar && <View style={styles.drawerStatusBar} />}
      </View>
    );
    const childrenWrapper = (
      <View style={styles.mainSubview} collapsable={false}>
        {drawStatusBar && (
          <StatusBar
            translucent
            backgroundColor={this.props.statusBarBackgroundColor}
          />
        )}
        {drawStatusBar && (
          <View
            style={[
              styles.statusBar,
              {backgroundColor: this.props.statusBarBackgroundColor},
            ]}
          />
        )}
        {this.props.children}
      </View>
    );
    return (
      <AndroidDrawerLayoutNativeComponent
        {...props}
        /* $FlowFixMe(>=0.87.0 site=react_native_android_fb) This comment
         * suppresses an error found when Flow v0.87 was deployed. To see the
         * error, delete this comment and run Flow. */
        ref={this._nativeRef}
        drawerWidth={this.props.drawerWidth}
        drawerPosition={this.props.drawerPosition}
        drawerLockMode={this.props.drawerLockMode}
        style={[styles.base, this.props.style]}
        onDrawerSlide={this._onDrawerSlide}
        onDrawerOpen={this._onDrawerOpen}
        onDrawerClose={this._onDrawerClose}
        onDrawerStateChanged={this._onDrawerStateChanged}>
        {childrenWrapper}
        {drawerViewWrapper}
      </AndroidDrawerLayoutNativeComponent>
    );
  }

  _onDrawerSlide = (event: DrawerSlideEvent) => {
    if (this.props.onDrawerSlide) {
      this.props.onDrawerSlide(event);
    }
    if (this.props.keyboardDismissMode === 'on-drag') {
      dismissKeyboard();
    }
  };

  _onDrawerOpen = () => {
    if (this.props.onDrawerOpen) {
      this.props.onDrawerOpen();
    }
  };

  _onDrawerClose = () => {
    if (this.props.onDrawerClose) {
      this.props.onDrawerClose();
    }
  };

  _onDrawerStateChanged = (event: DrawerStateEvent) => {
    if (this.props.onDrawerStateChanged) {
      this.props.onDrawerStateChanged(
        DRAWER_STATES[event.nativeEvent.drawerState],
      );
    }
  };

  /**
   * Opens the drawer.
   */
  openDrawer() {
    UIManager.dispatchViewManagerCommand(
      this._getDrawerLayoutHandle(),
      UIManager.getViewManagerConfig('AndroidDrawerLayout').Commands.openDrawer,
      null,
    );
  }

  /**
   * Closes the drawer.
   */
  closeDrawer() {
    UIManager.dispatchViewManagerCommand(
      this._getDrawerLayoutHandle(),
      UIManager.getViewManagerConfig('AndroidDrawerLayout').Commands
        .closeDrawer,
      null,
    );
  }

  /**
   * Closing and opening example
   * Note: To access the drawer you have to give it a ref
   *
   * Class component:
   *
   * render () {
   *   this.openDrawer = () => {
   *     this.refs.DRAWER.openDrawer()
   *   }
   *   this.closeDrawer = () => {
   *     this.refs.DRAWER.closeDrawer()
   *   }
   *   return (
   *     <DrawerLayoutAndroid ref={'DRAWER'}>
   *      {children}
   *     </DrawerLayoutAndroid>
   *   )
   * }
   *
   * Function component:
   *
   * const drawerRef = useRef()
   * const openDrawer = () => {
   *   drawerRef.current.openDrawer()
   * }
   * const closeDrawer = () => {
   *   drawerRef.current.closeDrawer()
   * }
   * return (
   *   <DrawerLayoutAndroid ref={drawerRef}>
   *     {children}
   *   </DrawerLayoutAndroid>
   * )
   */
  _getDrawerLayoutHandle() {
    return ReactNative.findNodeHandle(this._nativeRef.current);
  }

  /**
   * Native methods
   */
  blur() {
    /* $FlowFixMe(>=0.87.0 site=react_native_android_fb) This comment
     * suppresses an error found when Flow v0.87 was deployed. To see the
     * error, delete this comment and run Flow. */
    nullthrows(this._nativeRef.current).blur();
  }

  focus() {
    /* $FlowFixMe(>=0.87.0 site=react_native_android_fb) This comment
     * suppresses an error found when Flow v0.87 was deployed. To see the
     * error, delete this comment and run Flow. */
    nullthrows(this._nativeRef.current).focus();
  }

  measure(callback: MeasureOnSuccessCallback) {
    /* $FlowFixMe(>=0.87.0 site=react_native_android_fb) This comment
     * suppresses an error found when Flow v0.87 was deployed. To see the
     * error, delete this comment and run Flow. */
    nullthrows(this._nativeRef.current).measure(callback);
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback) {
    /* $FlowFixMe(>=0.87.0 site=react_native_android_fb) This comment
     * suppresses an error found when Flow v0.87 was deployed. To see the
     * error, delete this comment and run Flow. */
    nullthrows(this._nativeRef.current).measureInWindow(callback);
  }

  measureLayout(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void,
  ) {
    /* $FlowFixMe(>=0.87.0 site=react_native_android_fb) This comment
     * suppresses an error found when Flow v0.87 was deployed. To see the
     * error, delete this comment and run Flow. */
    nullthrows(this._nativeRef.current).measureLayout(
      relativeToNativeNode,
      onSuccess,
      onFail,
    );
  }

  setNativeProps(nativeProps: Object) {
    /* $FlowFixMe(>=0.87.0 site=react_native_android_fb) This comment
     * suppresses an error found when Flow v0.87 was deployed. To see the
     * error, delete this comment and run Flow. */
    nullthrows(this._nativeRef.current).setNativeProps(nativeProps);
  }
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    elevation: 16,
  },
  mainSubview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawerSubview: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  statusBar: {
    height: StatusBar.currentHeight,
  },
  drawerStatusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StatusBar.currentHeight,
    backgroundColor: 'rgba(0, 0, 0, 0.251)',
  },
});

module.exports = DrawerLayoutAndroid;
