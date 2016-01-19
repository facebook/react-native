/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StatusBar
 * @flow
 */
'use strict';

const React = require('React');
const ColorPropType = require('ColorPropType');
const Platform = require('Platform');

const processColor = require('processColor');

if (Platform.OS === 'ios') {
  var RCTStatusBarManager = require('NativeModules').StatusBarManager;
} else if (Platform.OS === 'android') {
  var RCTStatusBarManager = require('NativeModules').StatusBarAndroid;
}

import type ReactElement from 'ReactElement';

type DefaultProps = {
  animated: boolean;
};

const StatusBar = React.createClass({
  statics: {
    _propStack: [],
  },

  propTypes: {
    /**
     * If the status bar is hidden.
     */
    hidden: React.PropTypes.bool,
    /**
     * If the transition between status bar property changes should be animated.
     * Supported for color, barStyle and hidden.
     */
    animated: React.PropTypes.bool,
    /**
     * The color of the status bar.
     * @platform android
     */
    color: ColorPropType,
    /**
     * If the status bar is translucent.
     * When translucent is set to true, the app will draw under the status bar.
     * This is useful when using a semi transparent status bar color.
     *
     * @platform android
     */
    translucent: React.PropTypes.bool,
    /**
     * Sets the color of the status bar text.
     *
     * @platform ios
     */
    barStyle: React.PropTypes.oneOf([
      'default',
      'light-content',
    ]),
    /**
     * If the network activity indicator should be visible.
     *
     * @platform ios
     */
    networkActivityIndicatorVisible: React.PropTypes.bool,
  },

  getDefaultProps(): DefaultProps {
    return {
      animated: false,
    };
  },

  _propStackIndex: 0,

  componentDidMount() {
    // Every time a StatusBar component is mounted, we push it's prop to a stack
    // and always update the native status bar with the props from the top of then
    // stack. This allows having multiple StatusBar components and the one that is
    // added last or is deeper in the view hierachy will have priority.
    this._propStackIndex = StatusBar._propStack.length;
    StatusBar._propStack.push(this.props);
    this._updateFromStack(this.props.animated);
  },

  componentWillUnmount() {
    // When a StatusBar is unmounted, remove itself from the stack and update
    // the native bar with the next props.
    // TODO: This will break if a component is unmount while it's not at then
    // top of the stack.
    StatusBar._propStack.pop();
    this._updateFromStack(this.props.animated);
  },

  componentDidUpdate() {
    StatusBar._propStack[this._propStackIndex] = this.props;
    // Only the StatusBar that is on top of the stack can send it's props
    // to the native status bar.
    if (this._propStackIndex === StatusBar._propStack.length - 1) {
      this._updateFromStack(this.props.animated);
    }
  },

  /**
   * Merges the prop stack with the default values.
   */
  _mergeStackProps(): Array<any> {
    return StatusBar._propStack.reduce((prev, cur) => {
      return Object.assign(prev, cur);
    }, {
      color: 'black',
      barStyle: 'default',
      translucent: false,
      hidden: false,
      networkActivityIndicatorVisible: false,
    });
  },

  /**
   * Updates the native status bar with the props from the stack.
   */
  _updateFromStack(animated: boolean = false) {
    if (StatusBar._propStack.length === 0) {
      return;
    }
    const props = this._mergeStackProps();
    // TODO: check if props changed.
    if (Platform.OS === 'ios') {
      if (typeof props.barStyle !== 'undefined') {
        RCTStatusBarManager.setStyle(props.barStyle, animated);
      }
      if (typeof props.hidden !== 'undefined') {
        RCTStatusBarManager.setHidden(props.hidden, animated);
      }
      if (typeof props.networkActivityIndicatorVisible !== 'undefined') {
        RCTStatusBarManager.setNetworkActivityIndicatorVisible(
          props.networkActivityIndicatorVisible
        );
      }
    } else if (Platform.OS === 'android') {
      if (typeof props.color !== 'undefined') {
        RCTStatusBarManager.setColor(processColor(props.color), animated);
      }
      if (typeof props.hidden !== 'undefined') {
        RCTStatusBarManager.setHidden(props.hidden);
      }
      if (typeof props.translucent !== 'undefined') {
        RCTStatusBarManager.setTranslucent(props.translucent);
      }
    }
  },

  render(): ?ReactElement {
    return null;
  },
});

module.exports = StatusBar;
