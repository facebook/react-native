/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const NativeMethodsMixin = require('NativeMethodsMixin');
const Platform = require('Platform');
const React = require('React');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const StyleSheetPropType = require('StyleSheetPropType');
const TextStylePropTypes = require('TextStylePropTypes');
const Touchable = require('Touchable');

const createReactNativeComponentClass =
  require('createReactNativeComponentClass');
const merge = require('merge');

const stylePropType = StyleSheetPropType(TextStylePropTypes);

const viewConfig = {
  validAttributes: merge(ReactNativeViewAttributes.UIView, {
    isHighlighted: true,
    numberOfLines: true,
    allowFontScaling: true,
  }),
  uiViewClassName: 'RCTText',
};

/**
 * Shared code for the <Text> component.
 * See Text.ios.js for documentation.
 */
const TextBaseMixin = {
  propTypes: {
    /**
     * Specifies whether fonts should scale to respect the Text Size
     * accessibility setting on iOS.
     * @platform ios
     */
    allowFontScaling: React.PropTypes.bool,
    /**
     * Used to truncate the text with an ellipsis after computing the text
     * layout, including line wrapping, such that the total number of lines
     * does not exceed this number.
     */
    numberOfLines: React.PropTypes.number,
    /**
     * Invoked on mount and layout changes with
     *
     *   `{nativeEvent: {layout: {x, y, width, height}}}`
     */
    onLayout: React.PropTypes.func,
    /**
     * This function is called on press.
     */
    onPress: React.PropTypes.func,
    /**
     * This function is called on long press.
     */
    onLongPress: React.PropTypes.func,
    /**
     * When true, no visual change is made when text is pressed down. By
     * default, a gray oval highlights the text on press down.
     * @platform ios
     */
    suppressHighlighting: React.PropTypes.bool,
    style: stylePropType,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: React.PropTypes.string,
  },
  getDefaultProps(): Object {
    return {
      accessible: true,
      allowFontScaling: true,
    };
  },
  getInitialState: function(): Object {
    return merge(Touchable.Mixin.touchableGetInitialState(), {
      isHighlighted: false,
    });
  },
  mixins: [NativeMethodsMixin],
  viewConfig: viewConfig,
  getChildContext(): Object {
    return {isInAParentText: true};
  },
  childContextTypes: {
    isInAParentText: React.PropTypes.bool
  },
  contextTypes: {
    isInAParentText: React.PropTypes.bool
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
  getNewProps(): Object {
    let newProps = this.props;
    if (this.props.onStartShouldSetResponder || this._hasPressHandler()) {
      if (!this._handlers) {
        this._handlers = {
          onStartShouldSetResponder: (): bool => {
            const shouldSetFromProps = this.props.onStartShouldSetResponder &&
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

              this.touchableHandlePress = () => {
                this.props.onPress && this.props.onPress();
              };

              this.touchableHandleLongPress = () => {
                this.props.onLongPress && this.props.onLongPress();
              };

              this.touchableGetPressRectOffset = function(): RectOffset {
                return PRESS_RECT_OFFSET;
              };
            }
            return setResponder;
          },
          onResponderGrant: function(e: SyntheticEvent, dispatchID: string) {
            this.touchableHandleResponderGrant(e, dispatchID);
            this.props.onResponderGrant &&
              this.props.onResponderGrant.apply(this, arguments);
          }.bind(this),
          onResponderMove: function(e: SyntheticEvent) {
            this.touchableHandleResponderMove(e);
            this.props.onResponderMove &&
              this.props.onResponderMove.apply(this, arguments);
          }.bind(this),
          onResponderRelease: function(e: SyntheticEvent) {
            this.touchableHandleResponderRelease(e);
            this.props.onResponderRelease &&
              this.props.onResponderRelease.apply(this, arguments);
          }.bind(this),
          onResponderTerminate: function(e: SyntheticEvent) {
            this.touchableHandleResponderTerminate(e);
            this.props.onResponderTerminate &&
              this.props.onResponderTerminate.apply(this, arguments);
          }.bind(this),
          onResponderTerminationRequest: function(): bool {
            // Allow touchable or props.onResponderTerminationRequest to deny
            // the request
            var allowTermination = this.touchableHandleResponderTerminationRequest();
            if (allowTermination && this.props.onResponderTerminationRequest) {
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
    if (Touchable.TOUCH_TARGET_DEBUG && newProps.onPress) {
      newProps = {
        ...newProps,
        style: [this.props.style, {color: 'magenta'}],
      };
    }
    return newProps;
  },
};

type RectOffset = {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

var PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

module.exports = TextBaseMixin;
