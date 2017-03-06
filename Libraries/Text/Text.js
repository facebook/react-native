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

const ColorPropType = require('ColorPropType');
const EdgeInsetsPropType = require('EdgeInsetsPropType');
const NativeMethodsMixin = require('NativeMethodsMixin');
const Platform = require('Platform');
const React = require('React');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const StyleSheetPropType = require('StyleSheetPropType');
const TextStylePropTypes = require('TextStylePropTypes');
const Touchable = require('Touchable');

const processColor = require('processColor');
const createReactNativeComponentClass = require('createReactNativeComponentClass');
const mergeFast = require('mergeFast');

const { PropTypes } = React;

const stylePropType = StyleSheetPropType(TextStylePropTypes);

const viewConfig = {
  validAttributes: mergeFast(ReactNativeViewAttributes.UIView, {
    isHighlighted: true,
    numberOfLines: true,
    ellipsizeMode: true,
    allowFontScaling: true,
    selectable: true,
    selectionColor: true,
    adjustsFontSizeToFit: true,
    minimumFontScale: true,
    textBreakStrategy: true,
  }),
  uiViewClassName: 'RCTText',
};

/**
 * A React component for displaying text.
 *
 * `Text` supports nesting, styling, and touch handling.
 *
 * In the following example, the nested title and body text will inherit the `fontFamily` from
 *`styles.baseText`, but the title provides its own additional styles.  The title and body will
 * stack on top of each other on account of the literal newlines:
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react';
 * import { AppRegistry, Text, StyleSheet } from 'react-native';
 *
 * class TextInANest extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = {
 *       titleText: "Bird's Nest",
 *       bodyText: 'This is not really a bird nest.'
 *     };
 *   }
 *
 *   render() {
 *     return (
 *       <Text style={styles.baseText}>
 *         <Text style={styles.titleText} onPress={this.onPressTitle}>
 *           {this.state.titleText}{'\n'}{'\n'}
 *         </Text>
 *         <Text numberOfLines={5}>
 *           {this.state.bodyText}
 *         </Text>
 *       </Text>
 *     );
 *   }
 * }
 *
 * const styles = StyleSheet.create({
 *   baseText: {
 *     fontFamily: 'Cochin',
 *   },
 *   titleText: {
 *     fontSize: 20,
 *     fontWeight: 'bold',
 *   },
 * });
 *
 * // App registration and rendering
 * AppRegistry.registerComponent('TextInANest', () => TextInANest);
 * ```
 */

// $FlowFixMe(>=0.41.0)
const Text = React.createClass({
  propTypes: {
    /**
     * When `numberOfLines` is set, this prop defines how text will be truncated.
     * `numberOfLines` must be set in conjunction with this prop.
     *
     * This can be one of the following values:
     *
     * - `head` - The line is displayed so that the end fits in the container and the missing text
     * at the beginning of the line is indicated by an ellipsis glyph. e.g., "...wxyz"
     * - `middle` - The line is displayed so that the beginning and end fit in the container and the
     * missing text in the middle is indicated by an ellipsis glyph. "ab...yz"
     * - `tail` - The line is displayed so that the beginning fits in the container and the
     * missing text at the end of the line is indicated by an ellipsis glyph. e.g., "abcd..."
     * - `clip` - Lines are not drawn past the edge of the text container.
     *
     * The default is `tail`.
     *
     * > `clip` is working only for iOS
     */
    ellipsizeMode: PropTypes.oneOf(['head', 'middle', 'tail', 'clip']),
    /**
     * Used to truncate the text with an ellipsis after computing the text
     * layout, including line wrapping, such that the total number of lines
     * does not exceed this number.
     *
     * This prop is commonly used with `ellipsizeMode`.
     */
    numberOfLines: PropTypes.number,
    /**
     * Set text break strategy on Android API Level 23+, possible values are `simple`, `highQuality`, `balanced`
     * The default value is `highQuality`.
     * @platform android
     */
    textBreakStrategy: PropTypes.oneOf(['simple', 'highQuality', 'balanced']),
    /**
     * Invoked on mount and layout changes with
     *
     *   `{nativeEvent: {layout: {x, y, width, height}}}`
     */
    onLayout: PropTypes.func,
    /**
     * This function is called on press.
     *
     * e.g., `onPress={() => console.log('1st')}`
     */
    onPress: PropTypes.func,
    /**
     * This function is called on long press.
     *
     * e.g., `onLongPress={this.increaseSize}>`
     */
    onLongPress: PropTypes.func,
    /**
     * When the scroll view is disabled, this defines how far your touch may
     * move off of the button, before deactivating the button. Once deactivated,
     * try moving it back and you'll see that the button is once again
     * reactivated! Move it back and forth several times while the scroll view
     * is disabled. Ensure you pass in a constant to reduce memory allocations.
     */
    pressRetentionOffset: EdgeInsetsPropType,
    /**
     * Lets the user select text, to use the native copy and paste functionality.
     */
    selectable: PropTypes.bool,
    /**
     * The highlight color of the text.
     * @platform android
     */
    selectionColor: ColorPropType,
    /**
     * When `true`, no visual change is made when text is pressed down. By
     * default, a gray oval highlights the text on press down.
     * @platform ios
     */
    suppressHighlighting: PropTypes.bool,
    style: stylePropType,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
    /**
     * Specifies whether fonts should scale to respect Text Size accessibility settings. The
     * default is `true`.
     */
    allowFontScaling: PropTypes.bool,
    /**
     * When set to `true`, indicates that the view is an accessibility element. The default value
     * for a `Text` element is `true`.
     *
     * See the
     * [Accessibility guide](docs/accessibility.html#accessible-ios-android)
     * for more information.
     */
    accessible: PropTypes.bool,
    /**
     * Specifies whether font should be scaled down automatically to fit given style constraints.
     * @platform ios
     */
    adjustsFontSizeToFit: PropTypes.bool,

    /**
     * Specifies smallest possible scale a font can reach when adjustsFontSizeToFit is enabled. (values 0.01-1.0).
     * @platform ios
     */
    minimumFontScale: PropTypes.number,
  },
  getDefaultProps(): Object {
    return {
      accessible: true,
      allowFontScaling: true,
      ellipsizeMode: 'tail',
    };
  },
  getInitialState: function(): Object {
    return mergeFast(Touchable.Mixin.touchableGetInitialState(), {
      isHighlighted: false,
    });
  },
  mixins: [NativeMethodsMixin],
  viewConfig: viewConfig,
  getChildContext(): Object {
    return {isInAParentText: true};
  },
  childContextTypes: {
    isInAParentText: PropTypes.bool
  },
  contextTypes: {
    isInAParentText: PropTypes.bool
  },
  /**
   * Only assigned if touch is needed.
   */
  _handlers: (null: ?Object),
  _hasPressHandler(): boolean {
    return !!this.props.onPress || !!this.props.onLongPress;
  },
  /**
   * These are assigned lazily the first time the responder is set to make plain
   * text nodes as cheap as possible.
   */
  touchableHandleActivePressIn: (null: ?Function),
  touchableHandleActivePressOut: (null: ?Function),
  touchableHandlePress: (null: ?Function),
  touchableHandleLongPress: (null: ?Function),
  touchableGetPressRectOffset: (null: ?Function),
  render(): React.Element<any> {
    let newProps = this.props;
    if (this.props.onStartShouldSetResponder || this._hasPressHandler()) {
      if (!this._handlers) {
        this._handlers = {
          onStartShouldSetResponder: (): bool => {
            const shouldSetFromProps = this.props.onStartShouldSetResponder &&
                // $FlowFixMe(>=0.41.0)
                this.props.onStartShouldSetResponder();
            const setResponder = shouldSetFromProps || this._hasPressHandler();
            if (setResponder && !this.touchableHandleActivePressIn) {
              // Attach and bind all the other handlers only the first time a touch
              // actually happens.
              for (const key in Touchable.Mixin) {
                if (typeof Touchable.Mixin[key] === 'function') {
                  (this: any)[key] = Touchable.Mixin[key].bind(this);
                }
              }
              this.touchableHandleActivePressIn = () => {
                if (this.props.suppressHighlighting || !this._hasPressHandler()) {
                  return;
                }
                this.setState({
                  isHighlighted: true,
                });
              };

              this.touchableHandleActivePressOut = () => {
                if (this.props.suppressHighlighting || !this._hasPressHandler()) {
                  return;
                }
                this.setState({
                  isHighlighted: false,
                });
              };

              this.touchableHandlePress = (e: SyntheticEvent) => {
                this.props.onPress && this.props.onPress(e);
              };

              this.touchableHandleLongPress = (e: SyntheticEvent) => {
                this.props.onLongPress && this.props.onLongPress(e);
              };

              this.touchableGetPressRectOffset = function(): RectOffset {
                return this.props.pressRetentionOffset || PRESS_RECT_OFFSET;
              };
            }
            // $FlowFixMe(>=0.41.0)
            return setResponder;
          },
          onResponderGrant: function(e: SyntheticEvent, dispatchID: string) {
            // $FlowFixMe(>=0.41.0)
            this.touchableHandleResponderGrant(e, dispatchID);
            this.props.onResponderGrant &&
              // $FlowFixMe(>=0.41.0)
              this.props.onResponderGrant.apply(this, arguments);
          }.bind(this),
          onResponderMove: function(e: SyntheticEvent) {
            // $FlowFixMe(>=0.41.0)
            this.touchableHandleResponderMove(e);
            this.props.onResponderMove &&
              // $FlowFixMe(>=0.41.0)
              this.props.onResponderMove.apply(this, arguments);
          }.bind(this),
          onResponderRelease: function(e: SyntheticEvent) {
            // $FlowFixMe(>=0.41.0)
            this.touchableHandleResponderRelease(e);
            this.props.onResponderRelease &&
              // $FlowFixMe(>=0.41.0)
              this.props.onResponderRelease.apply(this, arguments);
          }.bind(this),
          onResponderTerminate: function(e: SyntheticEvent) {
            // $FlowFixMe(>=0.41.0)
            this.touchableHandleResponderTerminate(e);
            this.props.onResponderTerminate &&
              // $FlowFixMe(>=0.41.0)
              this.props.onResponderTerminate.apply(this, arguments);
          }.bind(this),
          onResponderTerminationRequest: function(): bool {
            // Allow touchable or props.onResponderTerminationRequest to deny
            // the request
            // $FlowFixMe(>=0.41.0)
            var allowTermination = this.touchableHandleResponderTerminationRequest();
            if (allowTermination && this.props.onResponderTerminationRequest) {
              // $FlowFixMe(>=0.41.0)
              allowTermination = this.props.onResponderTerminationRequest.apply(this, arguments);
            }
            return allowTermination;
          }.bind(this),
        };
      }
      newProps = {
        ...this.props,
        ...this._handlers,
        isHighlighted: this.state.isHighlighted,
      };
    }
    if (newProps.selectionColor != null) {
      newProps = {
        ...newProps,
        selectionColor: processColor(newProps.selectionColor)
      };
    }
    if (Touchable.TOUCH_TARGET_DEBUG && newProps.onPress) {
      newProps = {
        ...newProps,
        style: [this.props.style, {color: 'magenta'}],
      };
    }
    if (this.context.isInAParentText) {
      return <RCTVirtualText {...newProps} />;
    } else {
      return <RCTText {...newProps} />;
    }
  },
});

type RectOffset = {
  top: number,
  left: number,
  right: number,
  bottom: number,
}

var PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

var RCTText = createReactNativeComponentClass(viewConfig);
var RCTVirtualText = RCTText;

if (Platform.OS === 'android') {
  RCTVirtualText = createReactNativeComponentClass({
    validAttributes: mergeFast(ReactNativeViewAttributes.UIView, {
      isHighlighted: true,
    }),
    uiViewClassName: 'RCTVirtualText',
  });
}

module.exports = Text;
