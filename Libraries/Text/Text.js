/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule Text
 * @flow
 * @format
 */
'use strict';

const NativeMethodsMixin = require('NativeMethodsMixin');
const React = require('React');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const TextPropTypes = require('TextPropTypes');
const Touchable = require('Touchable');
const UIManager = require('UIManager');

const createReactClass = require('create-react-class');
const createReactNativeComponentClass = require('createReactNativeComponentClass');
const mergeFast = require('mergeFast');
const processColor = require('processColor');
const {ViewContextTypes} = require('ViewContext');

const viewConfig = {
  validAttributes: mergeFast(ReactNativeViewAttributes.UIView, {
    isHighlighted: true,
    numberOfLines: true,
    ellipsizeMode: true,
    allowFontScaling: true,
    disabled: true,
    selectable: true,
    selectionColor: true,
    adjustsFontSizeToFit: true,
    minimumFontScale: true,
    textBreakStrategy: true,
  }),
  uiViewClassName: 'RCTText',
};

import type {ViewChildContext} from 'ViewContext';

/**
 * A React component for displaying text.
 *
 * See https://facebook.github.io/react-native/docs/text.html
 */

const Text = createReactClass({
  displayName: 'Text',
  propTypes: TextPropTypes,
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
  getChildContext(): ViewChildContext {
    return {
      isInAParentText: true,
    };
  },
  childContextTypes: ViewContextTypes,
  contextTypes: ViewContextTypes,
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
          onStartShouldSetResponder: (): boolean => {
            const shouldSetFromProps =
              this.props.onStartShouldSetResponder &&
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
                if (
                  this.props.suppressHighlighting ||
                  !this._hasPressHandler()
                ) {
                  return;
                }
                this.setState({
                  isHighlighted: true,
                });
              };

              this.touchableHandleActivePressOut = () => {
                if (
                  this.props.suppressHighlighting ||
                  !this._hasPressHandler()
                ) {
                  return;
                }
                this.setState({
                  isHighlighted: false,
                });
              };

              this.touchableHandlePress = (e: SyntheticEvent<>) => {
                this.props.onPress && this.props.onPress(e);
              };

              this.touchableHandleLongPress = (e: SyntheticEvent<>) => {
                this.props.onLongPress && this.props.onLongPress(e);
              };

              this.touchableGetPressRectOffset = function(): RectOffset {
                return this.props.pressRetentionOffset || PRESS_RECT_OFFSET;
              };
            }
            return setResponder;
          },
          onResponderGrant: function(e: SyntheticEvent<>, dispatchID: string) {
            this.touchableHandleResponderGrant(e, dispatchID);
            this.props.onResponderGrant &&
              this.props.onResponderGrant.apply(this, arguments);
          }.bind(this),
          onResponderMove: function(e: SyntheticEvent<>) {
            this.touchableHandleResponderMove(e);
            this.props.onResponderMove &&
              this.props.onResponderMove.apply(this, arguments);
          }.bind(this),
          onResponderRelease: function(e: SyntheticEvent<>) {
            this.touchableHandleResponderRelease(e);
            this.props.onResponderRelease &&
              this.props.onResponderRelease.apply(this, arguments);
          }.bind(this),
          onResponderTerminate: function(e: SyntheticEvent<>) {
            this.touchableHandleResponderTerminate(e);
            this.props.onResponderTerminate &&
              this.props.onResponderTerminate.apply(this, arguments);
          }.bind(this),
          onResponderTerminationRequest: function(): boolean {
            // Allow touchable or props.onResponderTerminationRequest to deny
            // the request
            var allowTermination = this.touchableHandleResponderTerminationRequest();
            if (allowTermination && this.props.onResponderTerminationRequest) {
              allowTermination = this.props.onResponderTerminationRequest.apply(
                this,
                arguments,
              );
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
        selectionColor: processColor(newProps.selectionColor),
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
};

var PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

var RCTText = createReactNativeComponentClass(
  viewConfig.uiViewClassName,
  () => viewConfig,
);
var RCTVirtualText = RCTText;

if (UIManager.RCTVirtualText) {
  RCTVirtualText = createReactNativeComponentClass('RCTVirtualText', () => ({
    validAttributes: mergeFast(ReactNativeViewAttributes.UIView, {
      isHighlighted: true,
    }),
    uiViewClassName: 'RCTVirtualText',
  }));
}

module.exports = Text;
