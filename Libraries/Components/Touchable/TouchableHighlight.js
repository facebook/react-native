/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Pressability, {
  type PressabilityConfig,
} from '../../Pressability/Pressability';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import StyleSheet, {type ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import typeof TouchableWithoutFeedback from './TouchableWithoutFeedback';
import Platform from '../../Utilities/Platform';
import View from '../../Components/View/View';
import * as React from 'react';

type AndroidProps = $ReadOnly<{|
  nextFocusDown?: ?number,
  nextFocusForward?: ?number,
  nextFocusLeft?: ?number,
  nextFocusRight?: ?number,
  nextFocusUp?: ?number,
|}>;

type IOSProps = $ReadOnly<{|
  hasTVPreferredFocus?: ?boolean,
|}>;

type Props = $ReadOnly<{|
  ...React.ElementConfig<TouchableWithoutFeedback>,
  ...AndroidProps,
  ...IOSProps,

  activeOpacity?: ?number,
  underlayColor?: ?ColorValue,
  style?: ?ViewStyleProp,
  onShowUnderlay?: ?() => void,
  onHideUnderlay?: ?() => void,
  testOnly_pressed?: ?boolean,

  hostRef: React.Ref<typeof View>,
|}>;

type ExtraStyles = $ReadOnly<{|
  child: ViewStyleProp,
  underlay: ViewStyleProp,
|}>;

type State = $ReadOnly<{|
  pressability: Pressability,
  extraStyles: ?ExtraStyles,
|}>;

/**
 * A wrapper for making views respond properly to touches.
 * On press down, the opacity of the wrapped view is decreased, which allows
 * the underlay color to show through, darkening or tinting the view.
 *
 * The underlay comes from wrapping the child in a new View, which can affect
 * layout, and sometimes cause unwanted visual artifacts if not used correctly,
 * for example if the backgroundColor of the wrapped view isn't explicitly set
 * to an opaque color.
 *
 * TouchableHighlight must have one child (not zero or more than one).
 * If you wish to have several child components, wrap them in a View.
 *
 * Example:
 *
 * ```
 * renderButton: function() {
 *   return (
 *     <TouchableHighlight onPress={this._onPressButton}>
 *       <Image
 *         style={styles.button}
 *         source={require('./myButton.png')}
 *       />
 *     </TouchableHighlight>
 *   );
 * },
 * ```
 *
 *
 * ### Example
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react'
 * import {
 *   AppRegistry,
 *   StyleSheet,
 *   TouchableHighlight,
 *   Text,
 *   View,
 * } from 'react-native'
 *
 * class App extends Component {
 *   constructor(props) {
 *     super(props)
 *     this.state = { count: 0 }
 *   }
 *
 *   onPress = () => {
 *     this.setState({
 *       count: this.state.count+1
 *     })
 *   }
 *
 *  render() {
 *     return (
 *       <View style={styles.container}>
 *         <TouchableHighlight
 *          style={styles.button}
 *          onPress={this.onPress}
 *         >
 *          <Text> Touch Here </Text>
 *         </TouchableHighlight>
 *         <View style={[styles.countContainer]}>
 *           <Text style={[styles.countText]}>
 *             { this.state.count !== 0 ? this.state.count: null}
 *           </Text>
 *         </View>
 *       </View>
 *     )
 *   }
 * }
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     flex: 1,
 *     justifyContent: 'center',
 *     paddingHorizontal: 10
 *   },
 *   button: {
 *     alignItems: 'center',
 *     backgroundColor: '#DDDDDD',
 *     padding: 10
 *   },
 *   countContainer: {
 *     alignItems: 'center',
 *     padding: 10
 *   },
 *   countText: {
 *     color: '#FF00FF'
 *   }
 * })
 *
 * AppRegistry.registerComponent('App', () => App)
 * ```
 *
 */
class TouchableHighlight extends React.Component<Props, State> {
  _hideTimeout: ?TimeoutID;
  _isMounted: boolean = false;

  state: State = {
    pressability: new Pressability(this._createPressabilityConfig()),
    extraStyles:
      this.props.testOnly_pressed === true ? this._createExtraStyles() : null,
  };

  _createPressabilityConfig(): PressabilityConfig {
    return {
      cancelable: !this.props.rejectResponderTermination,
      disabled:
        this.props.disabled != null
          ? this.props.disabled
          : this.props.accessibilityState?.disabled,
      hitSlop: this.props.hitSlop,
      delayLongPress: this.props.delayLongPress,
      delayPressIn: this.props.delayPressIn,
      delayPressOut: this.props.delayPressOut,
      minPressDuration: 0,
      pressRectOffset: this.props.pressRetentionOffset,
      android_disableSound: this.props.touchSoundDisabled,
      onBlur: event => {
        if (Platform.isTV) {
          this._hideUnderlay();
        }
        if (this.props.onBlur != null) {
          this.props.onBlur(event);
        }
      },
      onFocus: event => {
        if (Platform.isTV) {
          this._showUnderlay();
        }
        if (this.props.onFocus != null) {
          this.props.onFocus(event);
        }
      },
      onLongPress: this.props.onLongPress,
      onPress: event => {
        if (this._hideTimeout != null) {
          clearTimeout(this._hideTimeout);
        }
        if (!Platform.isTV) {
          this._showUnderlay();
          this._hideTimeout = setTimeout(() => {
            this._hideUnderlay();
          }, this.props.delayPressOut ?? 0);
        }
        if (this.props.onPress != null) {
          this.props.onPress(event);
        }
      },
      onPressIn: event => {
        if (this._hideTimeout != null) {
          clearTimeout(this._hideTimeout);
          this._hideTimeout = null;
        }
        this._showUnderlay();
        if (this.props.onPressIn != null) {
          this.props.onPressIn(event);
        }
      },
      onPressOut: event => {
        if (this._hideTimeout == null) {
          this._hideUnderlay();
        }
        if (this.props.onPressOut != null) {
          this.props.onPressOut(event);
        }
      },
    };
  }

  _createExtraStyles(): ExtraStyles {
    return {
      child: {opacity: this.props.activeOpacity ?? 0.85},
      underlay: {
        backgroundColor:
          this.props.underlayColor === undefined
            ? 'black'
            : this.props.underlayColor,
      },
    };
  }

  _showUnderlay(): void {
    if (!this._isMounted || !this._hasPressHandler()) {
      return;
    }
    this.setState({extraStyles: this._createExtraStyles()});
    if (this.props.onShowUnderlay != null) {
      this.props.onShowUnderlay();
    }
  }

  _hideUnderlay(): void {
    if (this._hideTimeout != null) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }
    if (this.props.testOnly_pressed === true) {
      return;
    }
    if (this._hasPressHandler()) {
      this.setState({extraStyles: null});
      if (this.props.onHideUnderlay != null) {
        this.props.onHideUnderlay();
      }
    }
  }

  _hasPressHandler(): boolean {
    return (
      this.props.onPress != null ||
      this.props.onPressIn != null ||
      this.props.onPressOut != null ||
      this.props.onLongPress != null
    );
  }

  render(): React.Node {
    const child = React.Children.only(this.props.children);

    // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
    // adopting `Pressability`, so preserve that behavior.
    const {onBlur, onFocus, ...eventHandlersWithoutBlurAndFocus} =
      this.state.pressability.getEventHandlers();

    const accessibilityState =
      this.props.disabled != null
        ? {
            ...this.props.accessibilityState,
            disabled: this.props.disabled,
          }
        : this.props.accessibilityState;

    return (
      <View
        accessible={this.props.accessible !== false}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityHint={this.props.accessibilityHint}
        accessibilityLanguage={this.props.accessibilityLanguage}
        accessibilityRole={this.props.accessibilityRole}
        accessibilityState={accessibilityState}
        accessibilityValue={this.props.accessibilityValue}
        accessibilityActions={this.props.accessibilityActions}
        onAccessibilityAction={this.props.onAccessibilityAction}
        importantForAccessibility={this.props.importantForAccessibility}
        accessibilityLiveRegion={this.props.accessibilityLiveRegion}
        accessibilityViewIsModal={this.props.accessibilityViewIsModal}
        accessibilityElementsHidden={this.props.accessibilityElementsHidden}
        style={StyleSheet.compose(
          this.props.style,
          this.state.extraStyles?.underlay,
        )}
        onLayout={this.props.onLayout}
        hitSlop={this.props.hitSlop}
        hasTVPreferredFocus={this.props.hasTVPreferredFocus}
        nextFocusDown={this.props.nextFocusDown}
        nextFocusForward={this.props.nextFocusForward}
        nextFocusLeft={this.props.nextFocusLeft}
        nextFocusRight={this.props.nextFocusRight}
        nextFocusUp={this.props.nextFocusUp}
        focusable={
          this.props.focusable !== false && this.props.onPress !== undefined
        }
        nativeID={this.props.nativeID}
        testID={this.props.testID}
        ref={this.props.hostRef}
        {...eventHandlersWithoutBlurAndFocus}>
        {React.cloneElement(child, {
          style: StyleSheet.compose(
            child.props.style,
            this.state.extraStyles?.child,
          ),
        })}
        {__DEV__ ? (
          <PressabilityDebugView color="green" hitSlop={this.props.hitSlop} />
        ) : null}
      </View>
    );
  }

  componentDidMount(): void {
    this._isMounted = true;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    this.state.pressability.configure(this._createPressabilityConfig());
  }

  componentWillUnmount(): void {
    this._isMounted = false;
    if (this._hideTimeout != null) {
      clearTimeout(this._hideTimeout);
    }
    this.state.pressability.reset();
  }
}

const Touchable = (React.forwardRef((props, hostRef) => (
  <TouchableHighlight {...props} hostRef={hostRef} />
)): React.AbstractComponent<
  $ReadOnly<$Diff<Props, {|hostRef: React.Ref<typeof View>|}>>,
  React.ElementRef<typeof View>,
>);

Touchable.displayName = 'TouchableHighlight';

module.exports = Touchable;
