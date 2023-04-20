/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {NativeSyntheticEvent} from '../../Types/CoreEventTypes';

/**
 * @see https://reactnative.dev/docs/accessibility#accessibility-properties
 */
export interface AccessibilityProps
  extends AccessibilityPropsAndroid,
    AccessibilityPropsIOS {
  /**
   * When true, indicates that the view is an accessibility element.
   * By default, all the touchable elements are accessible.
   */
  accessible?: boolean | undefined;

  /**
   * Provides an array of custom actions available for accessibility.
   */
  accessibilityActions?: ReadonlyArray<AccessibilityActionInfo> | undefined;

  /**
   * Overrides the text that's read by the screen reader when the user interacts with the element. By default, the
   * label is constructed by traversing all the children and accumulating all the Text nodes separated by space.
   */
  accessibilityLabel?: string | undefined;

  /**
   * Alias for accessibilityLabel  https://reactnative.dev/docs/view#accessibilitylabel
   * https://github.com/facebook/react-native/issues/34424
   */
  'aria-label'?: string | undefined;

  /**
   * Accessibility Role tells a person using either VoiceOver on iOS or TalkBack on Android the type of element that is focused on.
   */
  accessibilityRole?: AccessibilityRole | undefined;
  /**
   * Accessibility State tells a person using either VoiceOver on iOS or TalkBack on Android the state of the element currently focused on.
   */
  accessibilityState?: AccessibilityState | undefined;

  /**
   * alias for accessibilityState
   *
   * see https://reactnative.dev/docs/accessibility#accessibilitystate
   */
  'aria-busy'?: boolean | undefined;
  'aria-checked'?: boolean | 'mixed' | undefined;
  'aria-disabled'?: boolean | undefined;
  'aria-expanded'?: boolean | undefined;
  'aria-selected'?: boolean | undefined;

  /**
   * Represents the nativeID of the associated label text. When the assistive technology focuses on the component with this props, the text is read aloud.
   *
   * @platform android
   */
  'aria-labelledby'?: string | undefined;

  /**
   * An accessibility hint helps users understand what will happen when they perform an action on the accessibility element when that result is not obvious from the accessibility label.
   */
  accessibilityHint?: string | undefined;
  /**
   * Represents the current value of a component. It can be a textual description of a component's value, or for range-based components, such as sliders and progress bars,
   * it contains range information (minimum, current, and maximum).
   */
  accessibilityValue?: AccessibilityValue | undefined;

  'aria-valuemax'?: AccessibilityValue['max'] | undefined;
  'aria-valuemin'?: AccessibilityValue['min'] | undefined;
  'aria-valuenow'?: AccessibilityValue['now'] | undefined;
  'aria-valuetext'?: AccessibilityValue['text'] | undefined;
  /**
   * When `accessible` is true, the system will try to invoke this function when the user performs an accessibility custom action.
   */
  onAccessibilityAction?:
    | ((event: AccessibilityActionEvent) => void)
    | undefined;

  /**
   * [Android] Controlling if a view fires accessibility events and if it is reported to accessibility services.
   */
  importantForAccessibility?:
    | ('auto' | 'yes' | 'no' | 'no-hide-descendants')
    | undefined;

  /**
   * A value indicating whether the accessibility elements contained within
   * this accessibility element are hidden.
   */
  'aria-hidden'?: boolean | undefined;

  'aria-live'?: ('polite' | 'assertive' | 'off') | undefined;
  'aria-modal'?: boolean | undefined;

  /**
   * Indicates to accessibility services to treat UI component like a specific role.
   */
  role?: Role | undefined;
}

export type AccessibilityActionInfo = Readonly<{
  name: AccessibilityActionName | string;
  label?: string | undefined;
}>;

export type AccessibilityActionName =
  /**
   * Generated when a screen reader user double taps the component.
   */
  | 'activate'
  /**
   * Generated when a screen reader user increments an adjustable component.
   */
  | 'increment'
  /**
   * Generated when a screen reader user decrements an adjustable component.
   */
  | 'decrement'
  /**
   * Generated when a TalkBack user places accessibility focus on the component and double taps and holds one finger on the screen.
   * @platform android
   */
  | 'longpress'
  /**
   * Generated when a VoiceOver user places focus on or inside the component and double taps with two fingers.
   * @platform ios
   * */
  | 'magicTap'
  /**
   * Generated when a VoiceOver user places focus on or inside the component and performs a two finger scrub gesture (left, right, left).
   * @platform ios
   * */
  | 'escape';

export type AccessibilityActionEvent = NativeSyntheticEvent<
  Readonly<{
    actionName: string;
  }>
>;

export interface AccessibilityState {
  /**
   * When true, informs accessible tools if the element is disabled
   */
  disabled?: boolean | undefined;
  /**
   * When true, informs accessible tools if the element is selected
   */
  selected?: boolean | undefined;
  /**
   * For items like Checkboxes and Toggle switches, reports their state to accessible tools
   */
  checked?: boolean | 'mixed' | undefined;
  /**
   *  When present, informs accessible tools if the element is busy
   */
  busy?: boolean | undefined;
  /**
   *  When present, informs accessible tools the element is expanded or collapsed
   */
  expanded?: boolean | undefined;
}

export interface AccessibilityValue {
  /**
   * The minimum value of this component's range. (should be an integer)
   */
  min?: number | undefined;

  /**
   * The maximum value of this component's range. (should be an integer)
   */
  max?: number | undefined;

  /**
   * The current value of this component's range. (should be an integer)
   */
  now?: number | undefined;

  /**
   * A textual description of this component's value. (will override minimum, current, and maximum if set)
   */
  text?: string | undefined;
}

export type AccessibilityRole =
  | 'none'
  | 'button'
  | 'togglebutton'
  | 'link'
  | 'search'
  | 'image'
  | 'keyboardkey'
  | 'text'
  | 'adjustable'
  | 'imagebutton'
  | 'header'
  | 'summary'
  | 'alert'
  | 'checkbox'
  | 'combobox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'scrollbar'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tabbar'
  | 'tablist'
  | 'timer'
  | 'list'
  | 'toolbar';

export interface AccessibilityPropsAndroid {
  /**
   * Indicates to accessibility services whether the user should be notified when this view changes.
   * Works for Android API >= 19 only.
   * See http://developer.android.com/reference/android/view/View.html#attr_android:accessibilityLiveRegion for references.
   * @platform android
   */
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive' | undefined;

  /**
   * Controls how view is important for accessibility which is if it fires accessibility events
   * and if it is reported to accessibility services that query the screen.
   * Works for Android only. See http://developer.android.com/reference/android/R.attr.html#importantForAccessibility for references.
   *
   * Possible values:
   *      'auto' - The system determines whether the view is important for accessibility - default (recommended).
   *      'yes' - The view is important for accessibility.
   *      'no' - The view is not important for accessibility.
   *      'no-hide-descendants' - The view is not important for accessibility, nor are any of its descendant views.
   */
  importantForAccessibility?:
    | 'auto'
    | 'yes'
    | 'no'
    | 'no-hide-descendants'
    | undefined;

  /**
   * A reference to another element `nativeID` used to build complex forms. The value of `accessibilityLabelledBy` should match the `nativeID` of the related element.
   * @platform android
   */
  accessibilityLabelledBy?: string | string[] | undefined;
}

export interface AccessibilityPropsIOS {
  /**
   * A Boolean value indicating whether the accessibility elements contained within this accessibility element
   * are hidden to the screen reader.
   * @platform ios
   */
  accessibilityElementsHidden?: boolean | undefined;

  /**
   * A Boolean value indicating whether VoiceOver should ignore the elements within views that are siblings of the receiver.
   * @platform ios
   */
  accessibilityViewIsModal?: boolean | undefined;

  /**
   * When accessible is true, the system will invoke this function when the user performs the escape gesture (scrub with two fingers).
   * @platform ios
   */
  onAccessibilityEscape?: (() => void) | undefined;

  /**
   * When `accessible` is true, the system will try to invoke this function when the user performs accessibility tap gesture.
   * @platform ios
   */
  onAccessibilityTap?: (() => void) | undefined;

  /**
   * When accessible is true, the system will invoke this function when the user performs the magic tap gesture.
   * @platform ios
   */
  onMagicTap?: (() => void) | undefined;

  /**
   * https://reactnative.dev/docs/accessibility#accessibilityignoresinvertcolorsios
   * @platform ios
   */
  accessibilityIgnoresInvertColors?: boolean | undefined;

  /**
   * By using the accessibilityLanguage property, the screen reader will understand which language to use while reading the element's label, value and hint. The provided string value must follow the BCP 47 specification (https://www.rfc-editor.org/info/bcp47).
   * https://reactnative.dev/docs/accessibility#accessibilitylanguage-ios
   * @platform ios
   */
  accessibilityLanguage?: string | undefined;
}

export type Role =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'definition'
  | 'dialog'
  | 'directory'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'meter'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'summary'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem';
