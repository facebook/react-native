/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {
  LayoutEvent,
  PressEvent,
  TextLayoutEvent,
} from '../Types/CoreEventTypes';
import type {Node} from 'react';
import type {TextStyleProp} from '../StyleSheet/StyleSheet';
import type {
  AccessibilityRole,
  AccessibilityState,
} from '../Components/View/ViewAccessibility';

export type PressRetentionOffset = $ReadOnly<{|
  top: number,
  left: number,
  bottom: number,
  right: number,
|}>;

/**
 * @see https://reactnative.dev/docs/text.html#reference
 */
export type TextProps = $ReadOnly<{|
  /**
    When set to `true`, indicates that the view is an accessibility element.

    See the [Accessibility guide](accessibility.md#accessible-ios-android) for
    more information.

    @default true
   */
  accessible?: ?boolean,
  /**
    An accessibility hint helps users understand what will happen when they
    perform an action on the accessibility element when that result is not clear
    from the accessibility label.
   */
  accessibilityHint?: ?Stringish,
  /**
    Overrides the text that's read by the screen reader when the user interacts
    with the element. By default, the label is constructed by traversing all the
    children and accumulating all the `Text` nodes separated by space.
   */
  accessibilityLabel?: ?Stringish,
  /**
    Tells the screen reader to treat the currently focused on element as having a specific role.

    Possible values for `AccessibilityRole` is one of:

    - `'none'` - The element has no role.
    - `'button'` - The element should be treated as a button.
    - `'link'` - The element should be treated as a link.
    - `'header'` - The element is a header that divides content into sections.
    - `'search'` - The element should be treated as a search field.
    - `'image'` - The element should be treated as an image.
    - `'key'` - The element should be treated like a keyboard key.
    - `'text'` - The element should be treated as text.
    - `'summary'` - The element provides app summary information.
    - `'imagebutton'` - The element has the role of both an image and also a
      button.
    - `'adjustable'` - The element allows adjustment over a range of values.

    On iOS, these roles map to corresponding Accessibility Traits. Image button
    has the same functionality as if the trait was set to both 'image' and
    'button'. See the
    [Accessibility guide](accessibility.md#accessibilitytraits-ios) for more
    information.

    On Android, these roles have similar functionality on TalkBack as adding
    Accessibility Traits does on Voiceover in iOS

    @type AccessibilityRole
   */
  accessibilityRole?: ?AccessibilityRole,
  /**
    Tells the screen reader to treat the currently focused on element as being
    in a specific state.

    You can provide one state, no state, or multiple states. The states must be
    passed in through an object. Ex: `{selected: true, disabled: true}`.

    Possible values for `AccessibilityState` are:

    - `'selected'` - The element is in a selected state.
    - `'disabled'` - The element is in a disabled state.
   */
  accessibilityState?: ?AccessibilityState,

  /**
    Specifies whether fonts should be scaled down automatically to fit given
    style constraints.

    @platform ios
   */
  adjustsFontSizeToFit?: ?boolean,

  /**
    Specifies whether fonts should scale to respect Text Size accessibility
    settings.

    @default true
   */
  allowFontScaling?: ?boolean,

  /**
    Sets the frequency of automatic hyphenation to use when determining word
    breaks on Android API Level 23+, possible values are `none`, `full`,
    `balanced`, `high`, `normal`.

    @platform android

    @default none
   */
  android_hyphenationFrequency?: ?(
    | 'normal'
    | 'none'
    | 'full'
    | 'high'
    | 'balanced'
  ),
  children?: ?Node,

  /**
    When `numberOfLines` is set, this prop defines how text will be truncated.
    `numberOfLines` must be set in conjunction with this prop.

    This can be one of the following values:

    - `head` - The line is displayed so that the end fits in the container and
      the missing text at the beginning of the line is indicated by an ellipsis
      glyph. e.g., "...wxyz"
    - `middle` - The line is displayed so that the beginning and end fit in the
      container and the missing text in the middle is indicated by an ellipsis
      glyph. "ab...yz"
    - `tail` - The line is displayed so that the beginning fits in the container
      and the missing text at the end of the line is indicated by an ellipsis
      glyph. e.g., "abcd..."
    - `clip` - Lines are not drawn past the edge of the text container.

    @default tail
   */
  ellipsizeMode?: ?('clip' | 'head' | 'middle' | 'tail'),

  /**
    Specifies largest possible scale a font can reach when `allowFontScaling` is
    enabled. Possible values:

    - `null/undefined` (default): inherit from the parent node or the global
      default (0)
    - `0`: no max, ignore parent/global default
    - `>= 1`: sets the `maxFontSizeMultiplier` of this node to this value
   */
  maxFontSizeMultiplier?: ?number,

  /**
    Used to locate this view from native code.
   */
  nativeID?: ?string,

  /**
    Used to truncate the text with an ellipsis after computing the text layout,
    including line wrapping, such that the total number of lines does not exceed
    this number.

    This prop is commonly used with `ellipsizeMode`.
   */
  numberOfLines?: ?number,

  /**
    Invoked on mount and layout changes with

    `{nativeEvent: {layout: {x, y, width, height}}}`
   */
  onLayout?: ?(event: LayoutEvent) => mixed,

  /**
    This function is called on long press.

    e.g., `onLongPress={this.increaseSize}>`
   */
  onLongPress?: ?(event: PressEvent) => mixed,

  /**
    This function is called on press. The first function argument is an event in
    form of [PressEvent](pressevent).

    e.g., `onPress={() => console.log('1st')}`
   */
  onPress?: ?(event: PressEvent) => mixed,

  /**
    The View is now responding for touch events. This is the time to highlight
    and show the user what is happening.

    `View.props.onResponderGrant: (event) => {}`, where `event` is a
    [PressEvent](pressevent).
   */
  onResponderGrant?: ?(event: PressEvent, dispatchID: string) => void,

  /**
    The user is moving their finger.

    `View.props.onResponderMove: (event) => {}`, where `event` is a
    [PressEvent](pressevent).
   */
  onResponderMove?: ?(event: PressEvent) => void,

  /**
    Fired at the end of the touch.

    `View.props.onResponderRelease: (event) => {}`, where `event` is a
    [PressEvent](pressevent).
   */
  onResponderRelease?: ?(event: PressEvent) => void,

  /**
    The responder has been taken from the `View`. Might be taken by other views
    after a call to `onResponderTerminationRequest`, or might be taken by the OS
    without asking (e.g., happens with control center/ notification center on
    iOS)

    `View.props.onResponderTerminate: (event) => {}`, where `event` is a
    [PressEvent](pressevent).
   */
  onResponderTerminate?: ?(event: PressEvent) => void,

  /**
    Some other `View` wants to become responder and is asking this `View` to
    release its responder. Returning `true` allows its release.

    `View.props.onResponderTerminationRequest: (event) => {}`, where `event` is
    a [PressEvent](pressevent).
   */
  onResponderTerminationRequest?: ?() => boolean,
  onStartShouldSetResponder?: ?() => boolean,

  /**
    Does this view want to "claim" touch responsiveness? This is called for
    every touch move on the `View` when it is not the responder.

    `View.props.onMoveShouldSetResponder: (event) => [true | false]`, where
    `event` is a [PressEvent](pressevent).
   */
  onMoveShouldSetResponder?: ?() => boolean,

  /**
    Invoked on Text layout

    - TextLayoutEvent - SyntheticEvent object that contains a key called `lines`
      with a value which is an array containing objects with the following
      properties
      - { x: number, y: number, width: number, height: number, ascender: number,
      capHeight: number, descender: number, text: string, xHeight: number,}
   */
  onTextLayout?: ?(event: TextLayoutEvent) => mixed,

  /**
    When the scroll view is disabled, this defines how far your touch may move
    off of the button, before deactivating the button. Once deactivated, try
    moving it back and you'll see that the button is once again reactivated!
    Move it back and forth several times while the scroll view is disabled.
    Ensure you pass in a constant to reduce memory allocations.
   */
  pressRetentionOffset?: ?PressRetentionOffset,

  /**
    Lets the user select text, to use the native copy and paste functionality.
   */
  selectable?: ?boolean,

  /**
    @type TextStyleProps, ViewStyleProps
   */
  style?: ?TextStyleProp,

  /**
    Used to locate this view in end-to-end tests.
   */
  testID?: ?string,

  /**
    Specifies the disabled state of the text view for testing purposes.

    @platform android
   */
  disabled?: ?boolean,

  /**
    The highlight color of the text.

    @platform android
   */
  selectionColor?: ?string,

  /**
    Determines the types of data converted to clickable URLs in the text
    element. By default no data types are detected.

    You can provide only one type.

    Possible values for `dataDetectorType` are:

    - `'phoneNumber'`
    - `'link'`
    - `'email'`
    - `'none'`
    - `'all'`

    @platform android
   */
  dataDetectorType?: ?('phoneNumber' | 'link' | 'email' | 'none' | 'all'),

  /**
    Set text break strategy on Android API Level 23+, possible values are
    `simple`, `highQuality`, `balanced`.

    @platform android

    @default highQuality
   */
  textBreakStrategy?: ?('balanced' | 'highQuality' | 'simple'),

  /**
   * iOS Only
   */
  adjustsFontSizeToFit?: ?boolean,

  /**
    Specifies smallest possible scale a font can reach when adjustsFontSizeToFit
    is enabled. (values 0.01-1.0).

    @platform ios
   */
  minimumFontScale?: ?number,

  /**
    When `true`, no visual change is made when text is pressed down. By default, a
    gray oval highlights the text on press down.

    @platform ios
   */
  suppressHighlighting?: ?boolean,
|}>;
