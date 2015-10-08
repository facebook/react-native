/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DrawerLayoutAndroid
 */
'use strict';

var DrawerConsts = require('NativeModules').UIManager.AndroidDrawerLayout.Constants;
var NativeMethodsMixin = require('NativeMethodsMixin');
var React = require('React');
var ReactPropTypes = require('ReactPropTypes');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var RCTUIManager = require('NativeModules').UIManager;
var StyleSheet = require('StyleSheet');
var View = require('View');

var createReactNativeComponentClass = require('createReactNativeComponentClass');
var dismissKeyboard = require('dismissKeyboard');
var merge = require('merge');

var RK_DRAWER_REF = 'drawerlayout';
var INNERVIEW_REF = 'innerView';

var DrawerLayoutValidAttributes = {
  drawerWidth: true,
  drawerPosition: true,
};

var DRAWER_STATES = [
  'Idle',
  'Dragging',
  'Settling',
];

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
var DrawerLayoutAndroid = React.createClass({
  statics: {
    positions: DrawerConsts.DrawerPosition,
  },

  propTypes: {
    /**
     * Determines whether the keyboard gets dismissed in response to a drag.
     *   - 'none' (the default), drags do not dismiss the keyboard.
     *   - 'on-drag', the keyboard is dismissed when a drag begins.
     */
    keyboardDismissMode: ReactPropTypes.oneOf([
      'none', // default
      'on-drag',
    ]),
    /**
     * Specifies the side of the screen from which the drawer will slide in.
     */
    drawerPosition: ReactPropTypes.oneOf([
      DrawerConsts.DrawerPosition.Left,
      DrawerConsts.DrawerPosition.Right
    ]),
    /**
     * Specifies the width of the drawer, more precisely the width of the view that be pulled in
     * from the edge of the window.
     */
    drawerWidth: ReactPropTypes.number,
    /**
     * Function called whenever there is an interaction with the navigation view.
     */
    onDrawerSlide: ReactPropTypes.func,
    /**
     * Function called when the drawer state has changed. The drawer can be in 3 states:
     * - idle, meaning there is no interaction with the navigation view happening at the time
     * - dragging, meaning there is currently an interation with the navigation view
     * - settling, meaning that there was an interaction with the navigation view, and the
     * navigation view is now finishing it's closing or opening animation
     */
    onDrawerStateChanged: ReactPropTypes.func,
    /**
     * Function called whenever the navigation view has been opened.
     */
    onDrawerOpen: ReactPropTypes.func,
    /**
     * Function called whenever the navigation view has been closed.
     */
    onDrawerClose: ReactPropTypes.func,
    /**
     * The navigation view that will be rendered to the side of the screen and can be pulled in.
     */
    renderNavigationView: ReactPropTypes.func.isRequired,
  },

  mixins: [NativeMethodsMixin],

  getInnerViewNode: function() {
    return this.refs[INNERVIEW_REF].getInnerViewNode();
  },

  render: function() {
    var drawerViewWrapper =
      <View style={[styles.drawerSubview, {width: this.props.drawerWidth}]} collapsable={false}>
        {this.props.renderNavigationView()}
      </View>;
    var childrenWrapper =
      <View ref={INNERVIEW_REF} style={styles.mainSubview} collapsable={false}>
        {this.props.children}
      </View>;
    return (
      <AndroidDrawerLayout
        {...this.props}
        ref={RK_DRAWER_REF}
        drawerWidth={this.props.drawerWidth}
        drawerPosition={this.props.drawerPosition}
        style={styles.base}
        onDrawerSlide={this._onDrawerSlide}
        onDrawerOpen={this._onDrawerOpen}
        onDrawerClose={this._onDrawerClose}
        onDrawerStateChanged={this._onDrawerStateChanged}>
        {childrenWrapper}
        {drawerViewWrapper}
      </AndroidDrawerLayout>
    );
  },

  _onDrawerSlide: function(event) {
    if (this.props.onDrawerSlide) {
      this.props.onDrawerSlide(event);
    }
    if (this.props.keyboardDismissMode === 'on-drag') {
      dismissKeyboard();
    }
  },

  _onDrawerOpen: function() {
    if (this.props.onDrawerOpen) {
      this.props.onDrawerOpen();
    }
  },

  _onDrawerClose: function() {
    if (this.props.onDrawerClose) {
      this.props.onDrawerClose();
    }
  },

  _onDrawerStateChanged: function(event) {
    if (this.props.onDrawerStateChanged) {
      this.props.onDrawerStateChanged(DRAWER_STATES[event.nativeEvent.drawerState]);
    }
  },

  openDrawer: function() {
    RCTUIManager.dispatchViewManagerCommand(
      this._getDrawerLayoutHandle(),
      RCTUIManager.AndroidDrawerLayout.Commands.openDrawer,
      null
    );
  },

  closeDrawer: function() {
    RCTUIManager.dispatchViewManagerCommand(
      this._getDrawerLayoutHandle(),
      RCTUIManager.AndroidDrawerLayout.Commands.closeDrawer,
      null
    );
  },

  _getDrawerLayoutHandle: function() {
    return React.findNodeHandle(this.refs[RK_DRAWER_REF]);
  },
});

var styles = StyleSheet.create({
  base: {
    flex: 1,
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
});

// The View that contains both the actual drawer and the main view
var AndroidDrawerLayout = createReactNativeComponentClass({
  validAttributes: merge(ReactNativeViewAttributes.UIView, DrawerLayoutValidAttributes),
  uiViewClassName: 'AndroidDrawerLayout',
});

module.exports = DrawerLayoutAndroid;
