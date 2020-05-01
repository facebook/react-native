/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Keyboard = require('./Keyboard');
const LayoutAnimation = require('../../LayoutAnimation/LayoutAnimation');
const Platform = require('../../Utilities/Platform');
const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const View = require('../View/View');

import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type EmitterSubscription from '../../vendor/emitter/EmitterSubscription';
import type {
  ViewProps,
  ViewLayout,
  ViewLayoutEvent,
} from '../View/ViewPropTypes';
import type {KeyboardEvent} from './Keyboard';

type Props = $ReadOnly<{|
  ...ViewProps,

  /**
   * Specify how to react to the presence of the keyboard.
   */
  behavior?: ?('height' | 'position' | 'padding'),

  /**
   * Style of the content container when `behavior` is 'position'.
   */
  contentContainerStyle?: ?ViewStyleProp,

  /**
   * Controls whether this `KeyboardAvoidingView` instance should take effect.
   * This is useful when more than one is on the screen. Defaults to true.
   */
  enabled: ?boolean,

  /**
   * Distance between the top of the user screen and the React Native view. This
   * may be non-zero in some cases. Defaults to 0.
   */
  keyboardVerticalOffset: number,
|}>;

type State = {|
  bottom: number,
|};

/**
 * View that moves out of the way when the keyboard appears by automatically
 * adjusting its height, position, or bottom padding.
 */
class KeyboardAvoidingView extends React.Component<Props, State> {
  static defaultProps: {|enabled: boolean, keyboardVerticalOffset: number|} = {
    enabled: true,
    keyboardVerticalOffset: 0,
  };

  _frame: ?ViewLayout = null;
  _subscriptions: Array<EmitterSubscription> = [];
  viewRef: {current: React.ElementRef<any> | null, ...};
  _initialFrameHeight: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = {bottom: 0};
    this.viewRef = React.createRef();
  }

  _relativeKeyboardHeight(keyboardFrame): number {
    const frame = this._frame;
    if (!frame || !keyboardFrame) {
      return 0;
    }

    const keyboardY = keyboardFrame.screenY - this.props.keyboardVerticalOffset;

    // Calculate the displacement needed for the view such that it
    // no longer overlaps with the keyboard
    return Math.max(frame.y + frame.height - keyboardY, 0);
  }

  _onKeyboardChange = (event: ?KeyboardEvent) => {
    if (event == null) {
      this.setState({bottom: 0});
      return;
    }

    const {duration, easing, endCoordinates} = event;
    const height = this._relativeKeyboardHeight(endCoordinates);

    if (this.state.bottom === height) {
      return;
    }

    if (duration && easing) {
      LayoutAnimation.configureNext({
        // We have to pass the duration equal to minimal accepted duration defined here: RCTLayoutAnimation.m
        duration: duration > 10 ? duration : 10,
        update: {
          duration: duration > 10 ? duration : 10,
          type: LayoutAnimation.Types[easing] || 'keyboard',
        },
      });
    }
    this.setState({bottom: height});
  };

  _onLayout = (event: ViewLayoutEvent) => {
    this._frame = event.nativeEvent.layout;
    if (!this._initialFrameHeight) {
      // save the initial frame height, before the keyboard is visible
      this._initialFrameHeight = this._frame.height;
    }
  };

  componentDidMount(): void {
    if (Platform.OS === 'ios') {
      this._subscriptions = [
        Keyboard.addListener('keyboardWillChangeFrame', this._onKeyboardChange),
      ];
    } else {
      this._subscriptions = [
        Keyboard.addListener('keyboardDidHide', this._onKeyboardChange),
        Keyboard.addListener('keyboardDidShow', this._onKeyboardChange),
      ];
    }
  }

  componentWillUnmount(): void {
    this._subscriptions.forEach(subscription => {
      subscription.remove();
    });
  }

  render(): React.Node {
    const {
      behavior,
      children,
      contentContainerStyle,
      enabled,
      keyboardVerticalOffset,
      style,
      ...props
    } = this.props;
    const bottomHeight = enabled ? this.state.bottom : 0;
    switch (behavior) {
      case 'height':
        let heightStyle;
        if (this._frame != null && this.state.bottom > 0) {
          // Note that we only apply a height change when there is keyboard present,
          // i.e. this.state.bottom is greater than 0. If we remove that condition,
          // this.frame.height will never go back to its original value.
          // When height changes, we need to disable flex.
          heightStyle = {
            height: this._initialFrameHeight - bottomHeight,
            flex: 0,
          };
        }
        return (
          <View
            ref={this.viewRef}
            style={StyleSheet.compose(
              style,
              heightStyle,
            )}
            onLayout={this._onLayout}
            {...props}>
            {children}
          </View>
        );

      case 'position':
        return (
          <View
            ref={this.viewRef}
            style={style}
            onLayout={this._onLayout}
            {...props}>
            <View
              style={StyleSheet.compose(
                contentContainerStyle,
                {
                  bottom: bottomHeight,
                },
              )}>
              {children}
            </View>
          </View>
        );

      case 'padding':
        return (
          <View
            ref={this.viewRef}
            style={StyleSheet.compose(
              style,
              {paddingBottom: bottomHeight},
            )}
            onLayout={this._onLayout}
            {...props}>
            {children}
          </View>
        );

      default:
        return (
          <View
            ref={this.viewRef}
            onLayout={this._onLayout}
            style={style}
            {...props}>
            {children}
          </View>
        );
    }
  }
}

module.exports = KeyboardAvoidingView;
