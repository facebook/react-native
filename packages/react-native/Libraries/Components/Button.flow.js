/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @generate-docs
 */

'use strict';

import type {PressEvent} from '../Types/CoreEventTypes';
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  AccessibilityState,
} from './View/ViewAccessibility';

import {type ColorValue} from '../StyleSheet/StyleSheet';
import * as React from 'react';

type ButtonProps = $ReadOnly<{|
  /**
    Text to display inside the button. On Android the given title will be
    converted to the uppercased form.
   */
  title: string,

  /**
    Handler to be called when the user taps the button. The first function
    argument is an event in form of [PressEvent](pressevent).
   */
  onPress: (event?: PressEvent) => mixed,

  /**
    If `true`, doesn't play system sound on touch.

    @platform android

    @default false
   */
  touchSoundDisabled?: ?boolean,

  /**
    Color of the text (iOS), or background color of the button (Android).

    @default {@platform android} '#2196F3'
    @default {@platform ios} '#007AFF'
   */
  color?: ?ColorValue,

  /**
    TV preferred focus.

    @platform tv

    @default false
   */
  hasTVPreferredFocus?: ?boolean,

  /**
    Designates the next view to receive focus when the user navigates down. See
    the [Android documentation][android:nextFocusDown].

    [android:nextFocusDown]:
    https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusDown

    @platform android, tv
   */
  nextFocusDown?: ?number,

  /**
    Designates the next view to receive focus when the user navigates forward.
    See the [Android documentation][android:nextFocusForward].

    [android:nextFocusForward]:
    https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusForward

    @platform android, tv
   */
  nextFocusForward?: ?number,

  /**
    Designates the next view to receive focus when the user navigates left. See
    the [Android documentation][android:nextFocusLeft].

    [android:nextFocusLeft]:
    https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusLeft

    @platform android, tv
   */
  nextFocusLeft?: ?number,

  /**
    Designates the next view to receive focus when the user navigates right. See
    the [Android documentation][android:nextFocusRight].

    [android:nextFocusRight]:
    https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusRight

    @platform android, tv
   */
  nextFocusRight?: ?number,

  /**
    Designates the next view to receive focus when the user navigates up. See
    the [Android documentation][android:nextFocusUp].

    [android:nextFocusUp]:
    https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusUp

    @platform android, tv
   */
  nextFocusUp?: ?number,

  /**
    Text to display for blindness accessibility features.
   */
  accessibilityLabel?: ?string,
  /**
   * Alias for accessibilityLabel  https://reactnative.dev/docs/view#accessibilitylabel
   * https://github.com/facebook/react-native/issues/34424
   */
  'aria-label'?: ?string,
  /**
    If `true`, disable all interactions for this component.

    @default false
   */
  disabled?: ?boolean,

  /**
    Used to locate this view in end-to-end tests.
   */
  testID?: ?string,

  /**
   * Accessibility props.
   */
  accessible?: ?boolean,
  accessibilityActions?: ?$ReadOnlyArray<AccessibilityActionInfo>,
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => mixed,
  accessibilityState?: ?AccessibilityState,

  /**
   * [Android] Controlling if a view fires accessibility events and if it is reported to accessibility services.
   */
  importantForAccessibility?: ?('auto' | 'yes' | 'no' | 'no-hide-descendants'),
  accessibilityHint?: ?string,
  accessibilityLanguage?: ?Stringish,
|}>;

/**
  A basic button component that should render nicely on any platform. Supports a
  minimal level of customization.

  If this button doesn't look right for your app, you can build your own button
  using [TouchableOpacity](touchableopacity) or
  [TouchableWithoutFeedback](touchablewithoutfeedback). For inspiration, look at
  the [source code for this button component][button:source]. Or, take a look at
  the [wide variety of button components built by the community]
  [button:examples].

  [button:source]:
  https://github.com/facebook/react-native/blob/HEAD/Libraries/Components/Button.js

  [button:examples]:
  https://js.coach/?menu%5Bcollections%5D=React%20Native&page=1&query=button

  ```jsx
  <Button
    onPress={onPressLearnMore}
    title="Learn More"
    color="#841584"
    accessibilityLabel="Learn more about this purple button"
  />
  ```

  ```SnackPlayer name=Button%20Example
  import React from 'react';
  import { StyleSheet, Button, View, SafeAreaView, Text, Alert } from 'react-native';

  const Separator = () => (
    <View style={styles.separator} />
  );

  const App = () => (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>
          The title and onPress handler are required. It is recommended to set accessibilityLabel to help make your app usable by everyone.
        </Text>
        <Button
          title="Press me"
          onPress={() => Alert.alert('Simple Button pressed')}
        />
      </View>
      <Separator />
      <View>
        <Text style={styles.title}>
          Adjust the color in a way that looks standard on each platform. On  iOS, the color prop controls the color of the text. On Android, the color adjusts the background color of the button.
        </Text>
        <Button
          title="Press me"
          color="#f194ff"
          onPress={() => Alert.alert('Button with adjusted color pressed')}
        />
      </View>
      <Separator />
      <View>
        <Text style={styles.title}>
          All interaction for the component are disabled.
        </Text>
        <Button
          title="Press me"
          disabled
          onPress={() => Alert.alert('Cannot press this one')}
        />
      </View>
      <Separator />
      <View>
        <Text style={styles.title}>
          This layout strategy lets the title define the width of the button.
        </Text>
        <View style={styles.fixToText}>
          <Button
            title="Left button"
            onPress={() => Alert.alert('Left button pressed')}
          />
          <Button
            title="Right button"
            onPress={() => Alert.alert('Right button pressed')}
          />
        </View>
      </View>
    </SafeAreaView>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      marginHorizontal: 16,
    },
    title: {
      textAlign: 'center',
      marginVertical: 8,
    },
    fixToText: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    separator: {
      marginVertical: 8,
      borderBottomColor: '#737373',
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
  });

  export default App;
  ```
 */
export type Button = React.ComponentType<ButtonProps>;
