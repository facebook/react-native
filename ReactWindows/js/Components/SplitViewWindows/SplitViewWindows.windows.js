/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SplitViewWindows
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var React = require('React');
var ReactPropTypes = require('ReactPropTypes');
var StyleSheet = require('StyleSheet');
var UIManager = require('UIManager');
var View = require('View');

var SplitViewConsts = UIManager.WindowsSplitView.Constants;

var dismissKeyboard = require('dismissKeyboard');
var requireNativeComponent = require('requireNativeComponent');

var RK_PANE_REF = 'paneView';
var CONTENT_REF = 'contentView';

var SplitViewValidAttributes = {
  paneWidth: true,
  panePosition: true
};

/**
 * React component that wraps the platform `SplitView` (Windows only). The
 * Pane (typically used for navigation) is rendered with `renderPaneView`
 * and direct children are the main view (where your content goes). The pane
 * view is initially not visible on the screen, but can be pulled in from the
 * side of the window specified by the `panePosition` prop and its width can
 * be set by the `paneWidth` prop.
 *
 * Example:
 *
 * ```
 * render: function() {
 *   var paneView = (
 *     <View style={{flex: 1, backgroundColor: '#fff'}}>
 *       <Text style={{margin: 10, fontSize: 15, textAlign: 'left'}}>I'm in the Pane!</Text>
 *     </View>
 *   );
 *   return (
 *     <SplitViewWindows
 *       paneWidth={300}
 *       panePosition={SplitViewWindows.positions.Left}
 *       renderNavigationView={() => navigationView}>
 *       <View style={{flex: 1, alignItems: 'center'}}>
 *         <Text style={{margin: 10, fontSize: 15, textAlign: 'right'}}>Hello</Text>
 *         <Text style={{margin: 10, fontSize: 15, textAlign: 'right'}}>World!</Text>
 *       </View>
 *     </SplitViewWindows>
 *   );
 * },
 * ```
 */
var SplitViewWindows = React.createClass({
  statics: {
    positions: SplitViewConsts.PanePositions,
  },

  propTypes: {
    ...View.propTypes,
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
     * Specifies the side of the screen from which the pane will slide in.
     */
    panePosition: ReactPropTypes.oneOf([
      SplitViewConsts.PanePositions.Left,
      SplitViewConsts.PanePositions.Right
    ]),
    /**
     * Specifies the width of the pane, more precisely the width of the view that be pulled in
     * from the edge of the window.
     */
    paneWidth: ReactPropTypes.number,
    /**
     * Function called whenever the pane view has been opened.
     */
    onPaneOpen: ReactPropTypes.func,
    /**
     * Function called whenever the pane view has been closed.
     */
    onPaneClose: ReactPropTypes.func,
    /**
     * The pane view that will be rendered to the side of the screen and can be pulled in.
     */
    renderPaneView: ReactPropTypes.func.isRequired,
  },

  mixins: [NativeMethodsMixin],

  getInnerViewNode: function() {
    return this.refs[CONTENT_REF].getInnerViewNode();
  },

  render: function() {
    var paneViewWrapper =
      <View style={[styles.paneSubview, {width: this.props.paneWidth}]} collapsable={false}>
        {this.props.renderPaneView()}
      </View>;
    var childrenWrapper =
      <View ref={CONTENT_REF} style={styles.mainSubview} collapsable={false}>
        {this.props.children}
      </View>;
    return (
      <WindowsSplitView
        {...this.props}
        ref={RK_PANE_REF}
        paneWidth={this.props.paneWidth}
        panePosition={this.props.panePosition}
        style={styles.base}
        onPaneOpen={this._onPaneOpen}
        onPaneClose={this._onPaneClose}>
        {childrenWrapper}
        {paneViewWrapper}
      </WindowsSplitView>
    );
  },

  _onPaneOpen: function() {
    if (this.props.onPaneOpen) {
      this.props.onPaneOpen();
    }
  },

  _onPaneClose: function() {
    if (this.props.onPaneClose) {
      this.props.onPaneClose();
    }
  },

  openPane: function() {
    UIManager.dispatchViewManagerCommand(
      this._getPaneLayoutHandle(),
      UIManager.WindowsSplitView.Commands.openPane,
      null
    );
  },

  closePane: function() {
    UIManager.dispatchViewManagerCommand(
      this._getPaneLayoutHandle(),
      UIManager.WindowsSplitView.Commands.closePane,
      null
    );
  },

  _getPaneLayoutHandle: function() {
    return React.findNodeHandle(this.refs[RK_PANE_REF]);
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
  paneSubview: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});

// The View that contains both the actual pane and the main view
var WindowsSplitView = requireNativeComponent('WindowsSplitView', SplitViewWindows);

module.exports = SplitViewWindows;
