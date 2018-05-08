/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const React = require('React');
const ReactNative = require('ReactNative');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const TextPropTypes = require('TextPropTypes');
const Touchable = require('Touchable');
const UIManager = require('UIManager');

const createReactNativeComponentClass = require('createReactNativeComponentClass');
const mergeFast = require('mergeFast');
const processColor = require('processColor');
const {ViewContextTypes} = require('ViewContext');

import type {PressEvent} from 'CoreEventTypes';
import type {TextProps} from 'TextProps';
import type {ViewChildContext} from 'ViewContext';

type State = {
  isHighlighted: boolean,
};

type RectOffset = {
  top: number,
  left: number,
  right: number,
  bottom: number,
};

const PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

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

/**
 * A React component for displaying text.
 *
 * See https://facebook.github.io/react-native/docs/text.html
 */
class Text extends ReactNative.NativeComponent<TextProps, State> {
  static propTypes = TextPropTypes;
  static childContextTypes = ViewContextTypes;
  static contextTypes = ViewContextTypes;

  static defaultProps = {
    accessible: true,
    allowFontScaling: true,
    ellipsizeMode: 'tail',
  };

  state = mergeFast(Touchable.Mixin.touchableGetInitialState(), {
    isHighlighted: false,
  });

  viewConfig = viewConfig;

  getChildContext(): ViewChildContext {
    return {
      isInAParentText: true,
    };
  }

  _handlers: ?Object;

  _hasPressHandler(): boolean {
    return !!this.props.onPress || !!this.props.onLongPress;
  }
  /**
   * These are assigned lazily the first time the responder is set to make plain
   * text nodes as cheap as possible.
   */
  touchableHandleActivePressIn: ?Function;
  touchableHandleActivePressOut: ?Function;
  touchableHandlePress: ?Function;
  touchableHandleLongPress: ?Function;
  touchableHandleResponderGrant: ?Function;
  touchableHandleResponderMove: ?Function;
  touchableHandleResponderRelease: ?Function;
  touchableHandleResponderTerminate: ?Function;
  touchableHandleResponderTerminationRequest: ?Function;
  touchableGetPressRectOffset: ?Function;

  render(): React.Element<any> {
    let newProps = this.props;
    if (this.props.onStartShouldSetResponder || this._hasPressHandler()) {
      if (!this._handlers) {
        this._handlers = {
          onStartShouldSetResponder: (): boolean => {
            const shouldSetFromProps =
              this.props.onStartShouldSetResponder &&
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

              this.touchableHandlePress = (e: PressEvent) => {
                this.props.onPress && this.props.onPress(e);
              };

              this.touchableHandleLongPress = (e: PressEvent) => {
                this.props.onLongPress && this.props.onLongPress(e);
              };

              this.touchableGetPressRectOffset = function(): RectOffset {
                return this.props.pressRetentionOffset || PRESS_RECT_OFFSET;
              };
            }
            return setResponder;
          },
          onResponderGrant: function(e: SyntheticEvent<>, dispatchID: string) {
            // $FlowFixMe TouchableMixin handlers couldn't actually be null
            this.touchableHandleResponderGrant(e, dispatchID);
            this.props.onResponderGrant &&
              this.props.onResponderGrant.apply(this, arguments);
          }.bind(this),
          onResponderMove: function(e: SyntheticEvent<>) {
            // $FlowFixMe TouchableMixin handlers couldn't actually be null
            this.touchableHandleResponderMove(e);
            this.props.onResponderMove &&
              this.props.onResponderMove.apply(this, arguments);
          }.bind(this),
          onResponderRelease: function(e: SyntheticEvent<>) {
            // $FlowFixMe TouchableMixin handlers couldn't actually be null
            this.touchableHandleResponderRelease(e);
            this.props.onResponderRelease &&
              this.props.onResponderRelease.apply(this, arguments);
          }.bind(this),
          onResponderTerminate: function(e: SyntheticEvent<>) {
            // $FlowFixMe TouchableMixin handlers couldn't actually be null
            this.touchableHandleResponderTerminate(e);
            this.props.onResponderTerminate &&
              this.props.onResponderTerminate.apply(this, arguments);
          }.bind(this),
          onResponderTerminationRequest: function(): boolean {
            // Allow touchable or props.onResponderTerminationRequest to deny
            // the request
            // $FlowFixMe TouchableMixin handlers couldn't actually be null
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
  }
}

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
