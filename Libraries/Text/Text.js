/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Text
 * @flow
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var Platform = require('Platform');
var React = require('React');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var StyleSheetPropType = require('StyleSheetPropType');
var TextStylePropTypes = require('TextStylePropTypes');
var Touchable = require('Touchable');

var createReactNativeComponentClass =
  require('createReactNativeComponentClass');
var merge = require('merge');

var stylePropType = StyleSheetPropType(TextStylePropTypes);

var viewConfig = {
  validAttributes: merge(ReactNativeViewAttributes.UIView, {
    isHighlighted: true,
    numberOfLines: true,
  }),
  uiViewClassName: 'RCTText',
};

/**
 * A React component for displaying text which supports nesting,
 * styling, and touch handling.  In the following example, the nested title and
 * body text will inherit the `fontFamily` from `styles.baseText`, but the title
 * provides its own additional styles.  The title and body will stack on top of
 * each other on account of the literal newlines:
 *
 * ```
 * renderText: function() {
 *   return (
 *     <Text style={styles.baseText}>
 *       <Text style={styles.titleText} onPress={this.onPressTitle}>
 *         {this.state.titleText + '\n\n'}
 *       </Text>
 *       <Text numberOfLines={5}>
 *         {this.state.bodyText}
 *       </Text>
 *     </Text>
 *   );
 * },
 * ...
 * var styles = StyleSheet.create({
 *   baseText: {
 *     fontFamily: 'Cochin',
 *   },
 *   titleText: {
 *     fontSize: 20,
 *     fontWeight: 'bold',
 *   },
 * };
 * ```
 */

var Text = React.createClass({

  mixins: [Touchable.Mixin, NativeMethodsMixin],

  propTypes: {
    /**
     * Used to truncate the text with an elipsis after computing the text
     * layout, including line wrapping, such that the total number of lines does
     * not exceed this number.
     */
    numberOfLines: React.PropTypes.number,
    /**
     * This function is called on press.  Text intrinsically supports press
     * handling with a default highlight state (which can be disabled with
     * `suppressHighlighting`).
     */
    onPress: React.PropTypes.func,
    /**
     * When true, no visual change is made when text is pressed down.  By
     * default, a gray oval highlights the text on press down.
     */
    suppressHighlighting: React.PropTypes.bool,
    style: stylePropType,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: React.PropTypes.string,
    /**
     * Invoked on mount and layout changes with
     *
     *   {nativeEvent: {layout: {x, y, width, height}}}.
     */
     onLayout: React.PropTypes.func,
  },

  viewConfig: viewConfig,

  getInitialState: function() {
    return merge(this.touchableGetInitialState(), {
      isHighlighted: false,
    });
  },

  onStartShouldSetResponder: function(): bool {
    var shouldSetFromProps = this.props.onStartShouldSetResponder &&
      this.props.onStartShouldSetResponder();
    return shouldSetFromProps || !!this.props.onPress;
  },

  /*
   * Returns true to allow responder termination
   */
  handleResponderTerminationRequest: function(): bool {
    // Allow touchable or props.onResponderTerminationRequest to deny
    // the request
    var allowTermination = this.touchableHandleResponderTerminationRequest();
    if (allowTermination && this.props.onResponderTerminationRequest) {
      allowTermination = this.props.onResponderTerminationRequest();
    }
    return allowTermination;
  },

  handleResponderGrant: function(e: SyntheticEvent, dispatchID: string) {
    this.touchableHandleResponderGrant(e, dispatchID);
    this.props.onResponderGrant &&
      this.props.onResponderGrant.apply(this, arguments);
  },

  handleResponderMove: function(e: SyntheticEvent) {
    this.touchableHandleResponderMove(e);
    this.props.onResponderMove &&
      this.props.onResponderMove.apply(this, arguments);
  },

  handleResponderRelease: function(e: SyntheticEvent) {
    this.touchableHandleResponderRelease(e);
    this.props.onResponderRelease &&
      this.props.onResponderRelease.apply(this, arguments);
  },

  handleResponderTerminate: function(e: SyntheticEvent) {
    this.touchableHandleResponderTerminate(e);
    this.props.onResponderTerminate &&
      this.props.onResponderTerminate.apply(this, arguments);
  },

  touchableHandleActivePressIn: function() {
    if (this.props.suppressHighlighting || !this.props.onPress) {
      return;
    }
    this.setState({
      isHighlighted: true,
    });
  },

  touchableHandleActivePressOut: function() {
    if (this.props.suppressHighlighting || !this.props.onPress) {
      return;
    }
    this.setState({
      isHighlighted: false,
    });
  },

  touchableHandlePress: function() {
    this.props.onPress && this.props.onPress();
  },

  touchableGetPressRectOffset: function(): RectOffset {
    return PRESS_RECT_OFFSET;
  },

  getChildContext: function(): Object {
    return {isInAParentText: true};
  },

  childContextTypes: {
    isInAParentText: React.PropTypes.bool
  },

  render: function() {
    var props = {};
    for (var key in this.props) {
      props[key] = this.props[key];
    }
    // Text is accessible by default
    if (props.accessible !== false) {
      props.accessible = true;
    }
    props.isHighlighted = this.state.isHighlighted;
    props.onStartShouldSetResponder = this.onStartShouldSetResponder;
    props.onResponderTerminationRequest =
      this.handleResponderTerminationRequest;
    props.onResponderGrant = this.handleResponderGrant;
    props.onResponderMove = this.handleResponderMove;
    props.onResponderRelease = this.handleResponderRelease;
    props.onResponderTerminate = this.handleResponderTerminate;

    // TODO: Switch to use contextTypes and this.context after React upgrade
    var context = ReactInstanceMap.get(this)._context;
    if (context.isInAParentText) {
      return <RCTVirtualText {...props} />;
    } else {
      return <RCTText {...props} />;
    }
  },
});

type RectOffset = {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

var PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

var RCTText = createReactNativeComponentClass(viewConfig);
var RCTVirtualText = RCTText;

if (Platform.OS === 'android') {
  RCTVirtualText = createReactNativeComponentClass({
    validAttributes: merge(ReactNativeViewAttributes.UIView, {
      isHighlighted: true,
    }),
    uiViewClassName: 'RCTVirtualText',
  });
}

module.exports = Text;
