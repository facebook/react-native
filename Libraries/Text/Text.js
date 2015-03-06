/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule Text
 * @typechecks static-only
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheetPropType = require('StyleSheetPropType');
var TextStylePropTypes = require('TextStylePropTypes');
var Touchable = require('Touchable');

var createReactIOSNativeComponentClass =
  require('createReactIOSNativeComponentClass');
var merge = require('merge');

var stylePropType = StyleSheetPropType(TextStylePropTypes);

var viewConfig = {
  validAttributes: merge(ReactIOSViewAttributes.UIView, {
    isHighlighted: true,
    numberOfLines: true,
  }),
  uiViewClassName: 'RCTText',
};

/**
 * <Text> - A react component for displaying text which supports nesting,
 * styling, and touch handling.  In the following example, the nested title and
 * body text will inherit the `fontFamily` from `styles.baseText`, but the title
 * provides its own additional styles.  The title and body will stack on top of
 * each other on account of the literal newlines:
 *
 *   renderText: function() {
 *     return (
 *       <Text style={styles.baseText}>
 *         <Text style={styles.titleText} onPress={this._onPressTitle}>
 *           {this.state.titleText + '\n\n'}
 *         </Text>
 *         <Text numberOfLines={5}>
 *           {this.state.bodyText}
 *         </Text>
 *       </Text>
 *     );
 *   },
 *   ...
 *   var styles = StyleSheet.create({
 *     baseText: {
 *       fontFamily: 'Cochin',
 *     },
 *     titleText: {
 *       fontSize: 20,
 *       fontWeight: 'bold',
 *     },
 *   };
 *
 * More example code in `TextExample.ios.js`
 */

var Text = React.createClass({

  mixins: [Touchable.Mixin, NativeMethodsMixin],

  statics: {
    stylePropType: stylePropType,
  },

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
  },

  viewConfig: viewConfig,

  getInitialState: function() {
    return merge(this.touchableGetInitialState(), {
      isHighlighted: false,
    });
  },

  onStartShouldSetResponder: function() {
    var shouldSetFromProps = this.props.onStartShouldSetResponder &&
      this.props.onStartShouldSetResponder();
    return shouldSetFromProps || !!this.props.onPress;
  },

  /*
   * Returns true to allow responder termination
   */
  handleResponderTerminationRequest: function() {
    // Allow touchable or props.onResponderTerminationRequest to deny
    // the request
    var allowTermination = this.touchableHandleResponderTerminationRequest();
    if (allowTermination && this.props.onResponderTerminationRequest) {
      allowTermination = this.props.onResponderTerminationRequest();
    }
    return allowTermination;
  },

  handleResponderGrant: function(e, dispatchID) {
    this.touchableHandleResponderGrant(e, dispatchID);
    this.props.onResponderGrant &&
      this.props.onResponderGrant.apply(this, arguments);
  },

  handleResponderMove: function(e) {
    this.touchableHandleResponderMove(e);
    this.props.onResponderMove &&
      this.props.onResponderMove.apply(this, arguments);
  },

  handleResponderRelease: function(e) {
    this.touchableHandleResponderRelease(e);
    this.props.onResponderRelease &&
      this.props.onResponderRelease.apply(this, arguments);
  },

  handleResponderTerminate: function(e) {
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

  touchableGetPressRectOffset: function() {
    return PRESS_RECT_OFFSET;
  },

  render: function() {
    var props = {};
    for (var key in this.props) {
      props[key] = this.props[key];
    }
    props.ref = this.getNodeHandle();
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
    return <RKText {...props} />;
  },
});

var PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

var RKText = createReactIOSNativeComponentClass(viewConfig);

module.exports = Text;
