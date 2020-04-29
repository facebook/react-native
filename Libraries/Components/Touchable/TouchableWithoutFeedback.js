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

<<<<<<< HEAD
const DeprecatedEdgeInsetsPropType = require('../../DeprecatedPropTypes/DeprecatedEdgeInsetsPropType');
const React = require('react');
const PropTypes = require('prop-types');
const Touchable = require('./Touchable');
const View = require('../View/View');

const createReactClass = require('create-react-class');
const ensurePositiveDelayProps = require('./ensurePositiveDelayProps');

const {
  DeprecatedAccessibilityRoles,
} = require('../../DeprecatedPropTypes/DeprecatedViewAccessibility');

=======
import Pressability from '../../Pressability/Pressability.js';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug.js';
import TVTouchable from './TVTouchable.js';
>>>>>>> fb/0.62-stable
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
} from '../../Components/View/ViewAccessibility';
import type {EdgeInsetsProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {
  BlurEvent,
  FocusEvent,
  LayoutEvent,
  PressEvent,
} from '../../Types/CoreEventTypes';
<<<<<<< HEAD
import type {EdgeInsetsProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {
  AccessibilityRole,
  AccessibilityStates,
  AccessibilityState,
  AccessibilityActionInfo,
  AccessibilityActionEvent,
} from '../View/ViewAccessibility';

// [TODO(macOS ISS#2323203)
const {DraggedTypes} = require('../View/DraggedType');
import type {DraggedTypesType} from '../View/DraggedType';
// ]TODO(macOS ISS#2323203)

type TargetEvent = SyntheticEvent<
  $ReadOnly<{|
    target: number,
  |}>,
>;

type BlurEvent = TargetEvent;
type FocusEvent = TargetEvent;

const PRESS_RETENTION_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};

const OVERRIDE_PROPS = [
  'accessibilityLabel',
  'accessibilityHint',
  'accessibilityIgnoresInvertColors',
  'accessibilityRole',
  'accessibilityStates',
  'accessibilityState',
  'accessibilityActions',
  'onAccessibilityAction',
  'hitSlop',
  'nativeID',
  'onBlur',
  'onFocus',
  'onLayout',
  'testID',
];

export type Props = $ReadOnly<{|
  accessible?: ?boolean,
  accessibilityLabel?: ?Stringish,
=======
import Platform from '../../Utilities/Platform';
import View from '../../Components/View/View';
import * as React from 'react';

type Props = $ReadOnly<{|
  accessibilityActions?: ?$ReadOnlyArray<AccessibilityActionInfo>,
  accessibilityElementsHidden?: ?boolean,
>>>>>>> fb/0.62-stable
  accessibilityHint?: ?Stringish,
  accessibilityIgnoresInvertColors?: ?boolean,
  accessibilityLabel?: ?Stringish,
  accessibilityLiveRegion?: ?('none' | 'polite' | 'assertive'),
  accessibilityRole?: ?AccessibilityRole,
<<<<<<< HEAD
  accessibilityStates?: ?AccessibilityStates,
  accessibilityState?: ?AccessibilityState,
  accessibilityActions?: ?$ReadOnlyArray<AccessibilityActionInfo>,
=======
  accessibilityState?: ?AccessibilityState,
  accessibilityValue?: ?AccessibilityValue,
  accessibilityViewIsModal?: ?boolean,
  accessible?: ?boolean,
>>>>>>> fb/0.62-stable
  children?: ?React.Node,
  delayLongPress?: ?number,
  delayPressIn?: ?number,
  delayPressOut?: ?number,
  disabled?: ?boolean,
  focusable?: ?boolean,
  hitSlop?: ?EdgeInsetsProp,
  importantForAccessibility?: ?('auto' | 'yes' | 'no' | 'no-hide-descendants'),
  nativeID?: ?string,
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => mixed,
  onBlur?: ?(event: BlurEvent) => mixed,
  onFocus?: ?(event: FocusEvent) => mixed,
  onLayout?: ?(event: LayoutEvent) => mixed,
  onLongPress?: ?(event: PressEvent) => mixed,
  onPress?: ?(event: PressEvent) => mixed,
  onPressIn?: ?(event: PressEvent) => mixed,
  onPressOut?: ?(event: PressEvent) => mixed,
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => void,
  acceptsKeyboardFocus?: ?boolean, // [TODO(macOS ISS#2323203)
  onMouseEnter?: ?Function,
  onMouseLeave?: ?Function,
  onDragEnter?: ?Function,
  onMouseLeave?: ?Function,
  onDragEnter?: ?Function,
  onDragLeave?: ?Function,
  onDrop?: ?Function,
  draggedTypes?: ?DraggedTypesType, // ]TODO(macOS ISS#2323203)
  pressRetentionOffset?: ?EdgeInsetsProp,
  rejectResponderTermination?: ?boolean,
  testID?: ?string,
  touchSoundDisabled?: ?boolean,
|}>;

<<<<<<< HEAD
/**
 * Do not use unless you have a very good reason. All elements that
 * respond to press should have a visual feedback when touched.
 *
 * TouchableWithoutFeedback supports only one child.
 * If you wish to have several child components, wrap them in a View.
 */
const TouchableWithoutFeedback = ((createReactClass({
  displayName: 'TouchableWithoutFeedback',
  mixins: [Touchable.Mixin],

  propTypes: {
    accessible: PropTypes.bool,
    accessibilityLabel: PropTypes.node,
    accessibilityHint: PropTypes.string,
    accessibilityIgnoresInvertColors: PropTypes.bool,
    accessibilityRole: PropTypes.oneOf(DeprecatedAccessibilityRoles),
    accessibilityStates: PropTypes.array,
    accessibilityState: PropTypes.object,
    accessibilityActions: PropTypes.array,
    onAccessibilityAction: PropTypes.func,
    tabIndex: PropTypes.number, // TODO(macOS/win ISS#2323203)
    /**
     * When `accessible` is true (which is the default) this may be called when
     * the OS-specific concept of "focus" occurs. Some platforms may not have
     * the concept of focus.
     */
    onFocus: PropTypes.func,
    /**
     * When `accessible` is true (which is the default) this may be called when
     * the OS-specific concept of "blur" occurs, meaning the element lost focus.
     * Some platforms may not have the concept of blur.
     */
    onBlur: PropTypes.func,
    /**
     * If true, disable all interactions for this component.
     */
    disabled: PropTypes.bool,
    /**
     * Called when the mouse enters the touchable element
     */
    onMouseEnter: PropTypes.func, // TODO(macOS ISS#2323203)
    /**
     * Called when the mouse exits the touchable element
     */
    onMouseLeave: PropTypes.func, // TODO(macOS ISS#2323203)
    /**
     * Fired when a dragged element enters a valid drop target
     */
    onDragEnter: PropTypes.func, // TODO(macOS ISS#2323203)
    /**
     * Fired when a dragged element leaves a valid drop target
     */
    onDragLeave: PropTypes.func, // TODO(macOS ISS#2323203)
    /**
     * Fired when an element is dropped on a valid drop target
     */
    onDrop: PropTypes.func, // TODO(macOS ISS#2323203)
    /**
     * Enables Drag'n'Drop Support for certain types of dragged types
     *
     * Possible values for `draggedTypes` are:
     *
     * - `'fileUrl'`
     *
     * @platform macos
     */
    draggedTypes: PropTypes.oneOfType([
      PropTypes.oneOf(DraggedTypes),
      PropTypes.arrayOf(PropTypes.oneOf(DraggedTypes)),
    ]), // TODO(macOS ISS#2323203)
    tooltip: PropTypes.string, // TODO(macOS/win ISS#2323203)
    /**
     * Called when the touch is released, but not if cancelled (e.g. by a scroll
     * that steals the responder lock).
     */
    onPress: PropTypes.func,
    /**
     * Called as soon as the touchable element is pressed and invoked even before onPress.
     * This can be useful when making network requests.
     */
    onPressIn: PropTypes.func,
    /**
     * Called as soon as the touch is released even before onPress.
     */
    onPressOut: PropTypes.func,
    /**
     * Invoked on mount and layout changes with
     *
     *   `{nativeEvent: {layout: {x, y, width, height}}}`
     */
    onLayout: PropTypes.func,
    /**
     * If true, doesn't play system sound on touch (Android Only)
     **/
    touchSoundDisabled: PropTypes.bool,

    onLongPress: PropTypes.func,

    nativeID: PropTypes.string,
    testID: PropTypes.string,

    /**
     * Delay in ms, from the start of the touch, before onPressIn is called.
     */
    delayPressIn: PropTypes.number,
    /**
     * Delay in ms, from the release of the touch, before onPressOut is called.
     */
    delayPressOut: PropTypes.number,
    /**
     * Delay in ms, from onPressIn, before onLongPress is called.
     */
    delayLongPress: PropTypes.number,
    /**
     * When the scroll view is disabled, this defines how far your touch may
     * move off of the button, before deactivating the button. Once deactivated,
     * try moving it back and you'll see that the button is once again
     * reactivated! Move it back and forth several times while the scroll view
     * is disabled. Ensure you pass in a constant to reduce memory allocations.
     */
    pressRetentionOffset: DeprecatedEdgeInsetsPropType,
    /**
     * This defines how far your touch can start away from the button. This is
     * added to `pressRetentionOffset` when moving off of the button.
     * ** NOTE **
     * The touch area never extends past the parent view bounds and the Z-index
     * of sibling views always takes precedence if a touch hits two overlapping
     * views.
     */
    hitSlop: DeprecatedEdgeInsetsPropType,
  },

  getInitialState: function() {
    return this.touchableGetInitialState();
  },

  componentDidMount: function() {
    ensurePositiveDelayProps(this.props);
  },

  UNSAFE_componentWillReceiveProps: function(nextProps: Object) {
    ensurePositiveDelayProps(nextProps);
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandlePress: function(e: PressEvent) {
    this.props.onPress && this.props.onPress(e);
  },

  touchableHandleActivePressIn: function(e: PressEvent) {
    this.props.onPressIn && this.props.onPressIn(e);
  },

  touchableHandleActivePressOut: function(e: PressEvent) {
    this.props.onPressOut && this.props.onPressOut(e);
  },

  touchableHandleLongPress: function(e: PressEvent) {
    this.props.onLongPress && this.props.onLongPress(e);
  },

  touchableGetPressRectOffset: function(): typeof PRESS_RETENTION_OFFSET {
    // $FlowFixMe Invalid prop usage
    return this.props.pressRetentionOffset || PRESS_RETENTION_OFFSET;
  },
=======
type State = $ReadOnly<{|
  pressability: Pressability,
|}>;
>>>>>>> fb/0.62-stable

const PASSTHROUGH_PROPS = [
  'accessibilityActions',
  'accessibilityElementsHidden',
  'accessibilityHint',
  'accessibilityIgnoresInvertColors',
  'accessibilityLabel',
  'accessibilityLiveRegion',
  'accessibilityRole',
  'accessibilityState',
  'accessibilityValue',
  'accessibilityViewIsModal',
  'hitSlop',
  'importantForAccessibility',
  'nativeID',
  'onAccessibilityAction',
  'onBlur',
  'onFocus',
  'onLayout',
  'testID',
];

class TouchableWithoutFeedback extends React.Component<Props, State> {
  _tvTouchable: ?TVTouchable;

  state: State = {
    pressability: new Pressability({
      getHitSlop: () => this.props.hitSlop,
      getLongPressDelayMS: () => {
        if (this.props.delayLongPress != null) {
          const maybeNumber = this.props.delayLongPress;
          if (typeof maybeNumber === 'number') {
            return maybeNumber;
          }
        }
        return 500;
      },
      getPressDelayMS: () => this.props.delayPressIn,
      getPressOutDelayMS: () => this.props.delayPressOut,
      getPressRectOffset: () => this.props.pressRetentionOffset,
      getTouchSoundDisabled: () => this.props.touchSoundDisabled,
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
      onLongPress: event => {
        if (this.props.onLongPress != null) {
          this.props.onLongPress(event);
        }
      },
      onPress: event => {
        if (this.props.onPress != null) {
          this.props.onPress(event);
        }
      },
      onPressIn: event => {
        if (this.props.onPressIn != null) {
          this.props.onPressIn(event);
        }
      },
      onPressOut: event => {
        if (this.props.onPressOut != null) {
          this.props.onPressOut(event);
        }
      },
      onResponderTerminationRequest: () =>
        !this.props.rejectResponderTermination,
      onStartShouldSetResponder: () => !this.props.disabled,
    }),
  };

  render(): React.Node {
    const element = React.Children.only(this.props.children);
    const children = [element.props.children];
    if (__DEV__) {
      if (element.type === View) {
        children.push(
          <PressabilityDebugView color="red" hitSlop={this.props.hitSlop} />,
        );
      }
    }

    // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
    // adopting `Pressability`, so preserve that behavior.
    const {
      onBlur,
      onFocus,
      ...eventHandlersWithoutBlurAndFocus
    } = this.state.pressability.getEventHandlers();

    const elementProps: {[string]: mixed, ...} = {
      ...eventHandlersWithoutBlurAndFocus,
      accessible: this.props.accessible !== false,
      focusable:
        this.props.focusable !== false && this.props.onPress !== undefined,
    };
    for (const prop of PASSTHROUGH_PROPS) {
      if (this.props[prop] !== undefined) {
        elementProps[prop] = this.props[prop];
      }
    }

    return React.cloneElement(element, elementProps, ...children);
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

  componentWillUnmount(): void {
    if (Platform.isTV) {
      if (this._tvTouchable != null) {
        this._tvTouchable.destroy();
      }
    }
<<<<<<< HEAD

    return (React: any).cloneElement(child, {
      ...overrides,
      accessible: this.props.accessible !== false,
      accessibilityLabel: this.props.accessibilityLabel,
      accessibilityHint: this.props.accessibilityHint,
      accessibilityRole: this.props.accessibilityRole,
      accessibilityStates: this.props.accessibilityStates,
      onAccessibilityAction: this.props.onAccessibilityAction, // TODO(OSS Candidate ISS#2710739)
      acceptsKeyboardFocus:
        (this.props.acceptsKeyboardFocus === undefined ||
          this.props.acceptsKeyboardFocus) &&
        !this.props.disabled, // TODO(macOS ISS#2323203)
      enableFocusRing:
        this.props.enableFocusRing === true && !this.props.disabled, // TODO(macOS ISS#2323203)
      tabIndex: this.props.tabIndex, // TODO(win ISS#2323203)
      nativeID: this.props.nativeID,
      testID: this.props.testID,
      onLayout: this.props.onLayout,
      hitSlop: this.props.hitSlop,
      focusable:
        this.props.focusable !== false && this.props.onPress !== undefined,
      onStartShouldSetResponder: this.touchableHandleStartShouldSetResponder,
      onResponderTerminationRequest: this
        .touchableHandleResponderTerminationRequest,
      onResponderGrant: this.touchableHandleResponderGrant,
      onResponderMove: this.touchableHandleResponderMove,
      onResponderRelease: this.touchableHandleResponderRelease,
      onResponderTerminate: this.touchableHandleResponderTerminate,
      tooltip: this.props.tooltip, // TODO(macOS/win ISS#2323203)
      onClick: this.touchableHandlePress, // TODO(android ISS)
      onMouseEnter: this.props.onMouseEnter, // [TODO(macOS ISS#2323203)
      onMouseLeave: this.props.onMouseLeave,
      onDragEnter: this.props.onDragEnter,
      onDragLeave: this.props.onDragLeave,
      onDrop: this.props.onDrop,
      draggedTypes: this.props.draggedTypes, // ]TODO(macOS ISS#2323203)
      children,
    });
  },
}): any): React.ComponentType<Props>);
=======
    this.state.pressability.reset();
  }
}
>>>>>>> fb/0.62-stable

module.exports = TouchableWithoutFeedback;
