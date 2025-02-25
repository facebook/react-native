/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
} from '../../../src/private/types/HostInstance';
import type {AccessibilityRole} from '../../Components/View/ViewAccessibility';
import typeof DrawerLayoutAndroidCommon from './DrawerLayoutAndroid.js';
import type {
  DrawerLayoutAndroidMethods,
  DrawerLayoutAndroidProps,
  DrawerLayoutAndroidState,
} from './DrawerLayoutAndroidTypes';

import StyleSheet from '../../StyleSheet/StyleSheet';
import dismissKeyboard from '../../Utilities/dismissKeyboard';
import StatusBar from '../StatusBar/StatusBar';
import View from '../View/View';
import AndroidDrawerLayoutNativeComponent, {
  Commands,
} from './AndroidDrawerLayoutNativeComponent';
import nullthrows from 'nullthrows';
import * as React from 'react';

const DRAWER_STATES = ['Idle', 'Dragging', 'Settling'];

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
 *       drawerPosition="left"
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
class DrawerLayoutAndroid
  extends React.Component<DrawerLayoutAndroidProps, DrawerLayoutAndroidState>
  implements DrawerLayoutAndroidMethods
{
  static get positions(): mixed {
    console.warn(
      'Setting DrawerLayoutAndroid drawerPosition using `DrawerLayoutAndroid.positions` is deprecated. Instead pass the string value "left" or "right"',
    );

    return {Left: 'left', Right: 'right'};
  }

  // $FlowFixMe[missing-local-annot]
  _nativeRef =
    React.createRef<
      React.ElementRef<typeof AndroidDrawerLayoutNativeComponent>,
    >();

  state: DrawerLayoutAndroidState = {
    drawerOpened: false,
  };

  render(): React.Node {
    const {
      drawerBackgroundColor = 'white',
      onDrawerStateChanged,
      renderNavigationView,
      onDrawerOpen,
      onDrawerClose,
      ...props
    } = this.props;
    const drawStatusBar = this.props.statusBarBackgroundColor != null;
    const drawerViewWrapper = (
      <View
        style={[
          styles.drawerSubview,
          {
            width: this.props.drawerWidth,
            backgroundColor: drawerBackgroundColor,
          },
        ]}
        pointerEvents={this.state.drawerOpened ? 'auto' : 'none'}
        collapsable={false}>
        {renderNavigationView()}
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
        ref={this._nativeRef}
        drawerBackgroundColor={drawerBackgroundColor}
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

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  _onDrawerSlide = event => {
    if (this.props.onDrawerSlide) {
      // $FlowFixMe[unused-promise]
      this.props.onDrawerSlide(event);
    }
    if (this.props.keyboardDismissMode === 'on-drag') {
      dismissKeyboard();
    }
  };

  _onDrawerOpen = () => {
    this.setState({
      drawerOpened: true,
    });
    if (this.props.onDrawerOpen) {
      this.props.onDrawerOpen();
    }
  };

  _onDrawerClose = () => {
    this.setState({
      drawerOpened: false,
    });
    if (this.props.onDrawerClose) {
      this.props.onDrawerClose();
    }
  };

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  _onDrawerStateChanged = event => {
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
    Commands.openDrawer(nullthrows(this._nativeRef.current));
  }

  /**
   * Closes the drawer.
   */
  closeDrawer() {
    Commands.closeDrawer(nullthrows(this._nativeRef.current));
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

  /**
   * Native methods
   */
  blur() {
    nullthrows(this._nativeRef.current).blur();
  }

  focus() {
    nullthrows(this._nativeRef.current).focus();
  }

  measure(callback: MeasureOnSuccessCallback) {
    nullthrows(this._nativeRef.current).measure(callback);
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback) {
    nullthrows(this._nativeRef.current).measureInWindow(callback);
  }

  measureLayout(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void,
  ) {
    nullthrows(this._nativeRef.current).measureLayout(
      relativeToNativeNode,
      onSuccess,
      onFail,
    );
  }

  setNativeProps(nativeProps: Object) {
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

export default DrawerLayoutAndroid as $FlowFixMe as DrawerLayoutAndroidCommon;
