/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @generate-docs
 */

'use strict';

import Pressability, {
  type PressabilityConfig,
} from '../../Pressability/Pressability';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import TVTouchable from './TVTouchable';
import typeof TouchableWithoutFeedback from './TouchableWithoutFeedback';
import Animated from 'react-native/Libraries/Animated/src/Animated';
import Easing from 'react-native/Libraries/Animated/src/Easing';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';
import flattenStyle from 'react-native/Libraries/StyleSheet/flattenStyle';
import Platform from '../../Utilities/Platform';
import * as React from 'react';

type TVProps = $ReadOnly<{|
  /**
    (Apple TV only) TV preferred focus (see documentation for the View
    component).

    @platform ios
   */
  hasTVPreferredFocus?: ?boolean,
  /**
    TV next focus down (see documentation for the View component).

    @platform android
   */
  nextFocusDown?: ?number,
  /**
    TV next focus forward (see documentation for the View component).

    @platform android
   */
  nextFocusForward?: ?number,
  /**
    TV next focus left (see documentation for the View component).

    @platform android
   */
  nextFocusLeft?: ?number,
  /**
    TV next focus right (see documentation for the View component).

    @platform android
   */
  nextFocusRight?: ?number,
  /**
    TV next focus up (see documentation for the View component).

    @platform android
   */
  nextFocusUp?: ?number,
|}>;

type Props = $ReadOnly<{|
  ...React.ElementConfig<TouchableWithoutFeedback>,
  ...TVProps,

  /**
    Determines what the opacity of the wrapped view should be when touch is
    active.

    @default 0.2
   */
  activeOpacity?: ?number,
  /**
    @type View.style
   */
  style?: ?ViewStyleProp,

  hostRef: React.Ref<typeof Animated.View>,
|}>;

type State = $ReadOnly<{|
  anim: Animated.Value,
  pressability: Pressability,
|}>;

/**
  > If you're looking for a more extensive and future-proof way to handle
  > touch-based input, check out the [Pressable](pressable.md) API.

  A wrapper for making views respond properly to touches. On press down, the
  opacity of the wrapped view is decreased, dimming it.

  Opacity is controlled by wrapping the children in an `Animated.View`, which is
  added to the view hierarchy. Be aware that this can affect layout.

  ```SnackPlayer name=TouchableOpacity%20Function%20Component%20Example
  import React, { useState } from "react";
  import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

  const App = () => {
    const [count, setCount] = useState(0);
    const onPress = () => setCount(prevCount => prevCount + 1);

    return (
      <View style={styles.container}>
        <View style={styles.countContainer}>
          <Text>Count: {count}</Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={onPress}
        >
          <Text>Press Here</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 10
    },
    button: {
      alignItems: "center",
      backgroundColor: "#DDDDDD",
      padding: 10
    },
    countContainer: {
      alignItems: "center",
      padding: 10
    }
  });

  export default App;
  ```

  ```SnackPlayer name=TouchableOpacity%20Class%20Component%20Example
  import React, { Component } from "react";
  import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

  class App extends Component {
    constructor(props) {
      super(props);
      this.state = { count: 0 };
    }

    onPress = () => {
      this.setState({
        count: this.state.count + 1
      });
    };

    render() {
      const { count } = this.state;
      return (
        <View style={styles.container}>
          <View style={styles.countContainer}>
            <Text>Count: {count}</Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={this.onPress}
          >
            <Text>Press Here</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 10
    },
    button: {
      alignItems: "center",
      backgroundColor: "#DDDDDD",
      padding: 10
    },
    countContainer: {
      alignItems: "center",
      padding: 10
    }
  });

  export default App;
  ```
 */
class TouchableOpacity extends React.Component<Props, State> {
  _tvTouchable: ?TVTouchable;

  state: State = {
    anim: new Animated.Value(this._getChildStyleOpacityWithDefault()),
    pressability: new Pressability(this._createPressabilityConfig()),
  };

  _createPressabilityConfig(): PressabilityConfig {
    return {
      cancelable: !this.props.rejectResponderTermination,
      disabled: this.props.disabled,
      hitSlop: this.props.hitSlop,
      delayLongPress: this.props.delayLongPress,
      delayPressIn: this.props.delayPressIn,
      delayPressOut: this.props.delayPressOut,
      minPressDuration: 0,
      pressRectOffset: this.props.pressRetentionOffset,
      onBlur: event => {
        if (Platform.isTV) {
          this._opacityInactive(250);
        }
        if (this.props.onBlur != null) {
          this.props.onBlur(event);
        }
      },
      onFocus: event => {
        if (Platform.isTV) {
          this._opacityActive(150);
        }
        if (this.props.onFocus != null) {
          this.props.onFocus(event);
        }
      },
      onLongPress: this.props.onLongPress,
      onPress: this.props.onPress,
      onPressIn: event => {
        this._opacityActive(
          event.dispatchConfig.registrationName === 'onResponderGrant'
            ? 0
            : 150,
        );
        if (this.props.onPressIn != null) {
          this.props.onPressIn(event);
        }
      },
      onPressOut: event => {
        this._opacityInactive(250);
        if (this.props.onPressOut != null) {
          this.props.onPressOut(event);
        }
      },
    };
  }

  /**
    ```jsx
    setOpacityTo((value: number), (duration: number));
    ```

    Animate the touchable to a new opacity.
   */
  _setOpacityTo(toValue: number, duration: number): void {
    Animated.timing(this.state.anim, {
      toValue,
      duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  _opacityActive(duration: number): void {
    this._setOpacityTo(this.props.activeOpacity ?? 0.2, duration);
  }

  _opacityInactive(duration: number): void {
    this._setOpacityTo(this._getChildStyleOpacityWithDefault(), duration);
  }

  _getChildStyleOpacityWithDefault(): number {
    const opacity = flattenStyle(this.props.style)?.opacity;
    return typeof opacity === 'number' ? opacity : 1;
  }

  render(): React.Node {
    // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
    // adopting `Pressability`, so preserve that behavior.
    const {
      onBlur,
      onFocus,
      ...eventHandlersWithoutBlurAndFocus
    } = this.state.pressability.getEventHandlers();

    return (
      <Animated.View
        accessible={this.props.accessible !== false}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityHint={this.props.accessibilityHint}
        accessibilityRole={this.props.accessibilityRole}
        accessibilityState={this.props.accessibilityState}
        accessibilityActions={this.props.accessibilityActions}
        onAccessibilityAction={this.props.onAccessibilityAction}
        accessibilityValue={this.props.accessibilityValue}
        importantForAccessibility={this.props.importantForAccessibility}
        accessibilityLiveRegion={this.props.accessibilityLiveRegion}
        accessibilityViewIsModal={this.props.accessibilityViewIsModal}
        accessibilityElementsHidden={this.props.accessibilityElementsHidden}
        style={[this.props.style, {opacity: this.state.anim}]}
        nativeID={this.props.nativeID}
        testID={this.props.testID}
        onLayout={this.props.onLayout}
        nextFocusDown={this.props.nextFocusDown}
        nextFocusForward={this.props.nextFocusForward}
        nextFocusLeft={this.props.nextFocusLeft}
        nextFocusRight={this.props.nextFocusRight}
        nextFocusUp={this.props.nextFocusUp}
        hasTVPreferredFocus={this.props.hasTVPreferredFocus}
        hitSlop={this.props.hitSlop}
        focusable={
          this.props.focusable !== false && this.props.onPress !== undefined
        }
        ref={this.props.hostRef}
        {...eventHandlersWithoutBlurAndFocus}>
        {this.props.children}
        {__DEV__ ? (
          <PressabilityDebugView color="cyan" hitSlop={this.props.hitSlop} />
        ) : null}
      </Animated.View>
    );
  }

  componentDidMount(): void {
    if (Platform.isTV) {
      this._tvTouchable = new TVTouchable(this, {
        getDisabled: () => this.props.disabled === true,
        onBlur: event => {
          if (this.props.onBlur != null) {
            this.props.onBlur(event);
          }
        },
        onFocus: event => {
          if (this.props.onFocus != null) {
            this.props.onFocus(event);
          }
        },
        onPress: event => {
          if (this.props.onPress != null) {
            this.props.onPress(event);
          }
        },
      });
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    this.state.pressability.configure(this._createPressabilityConfig());
    if (this.props.disabled !== prevProps.disabled) {
      this._opacityInactive(250);
    }
  }

  componentWillUnmount(): void {
    if (Platform.isTV) {
      if (this._tvTouchable != null) {
        this._tvTouchable.destroy();
      }
    }
    this.state.pressability.reset();
  }
}

module.exports = (React.forwardRef((props, hostRef) => (
  <TouchableOpacity {...props} hostRef={hostRef} />
)): React.AbstractComponent<$ReadOnly<$Diff<Props, {|hostRef: mixed|}>>>);
