/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PressEvent} from '../Types/CoreEventTypes';
import type {TextProps} from './TextProps';

import * as PressabilityDebug from '../Pressability/PressabilityDebug';
import usePressability from '../Pressability/usePressability';
import flattenStyle from '../StyleSheet/flattenStyle';
import processColor from '../StyleSheet/processColor';
import Platform from '../Utilities/Platform';
import TextAncestor from './TextAncestor';
import {NativeText, NativeVirtualText} from './TextNativeComponent';
import * as React from 'react';
import {useContext, useMemo, useState} from 'react';

/**
 * Text is the fundamental component for displaying text.
 *
 * @see https://reactnative.dev/docs/text
 */
const Text: React.AbstractComponent<
  TextProps,
  React.ElementRef<typeof NativeText | typeof NativeVirtualText>,
> = React.forwardRef((props: TextProps, forwardedRef) => {
  const {
    accessible,
    accessibilityLabel,
    accessibilityState,
    allowFontScaling,
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-label': ariaLabel,
    'aria-selected': ariaSelected,
    ellipsizeMode,
    disabled,
    id,
    nativeID,
    numberOfLines,
    onLongPress,
    onPress,
    onPressIn,
    onPressOut,
    onResponderGrant,
    onResponderMove,
    onResponderRelease,
    onResponderTerminate,
    onResponderTerminationRequest,
    onStartShouldSetResponder,
    pressRetentionOffset,
    selectable,
    selectionColor,
    suppressHighlighting,
    style,
    ...restProps
  } = props;

  const [isHighlighted, setHighlighted] = useState(false);

  const _accessibilityLabel = ariaLabel ?? accessibilityLabel;

  let _accessibilityState: ?TextProps['accessibilityState'] =
    accessibilityState;
  if (
    ariaBusy != null ||
    ariaChecked != null ||
    ariaDisabled != null ||
    ariaExpanded != null ||
    ariaSelected != null
  ) {
    if (_accessibilityState != null) {
      _accessibilityState = {
        busy: ariaBusy ?? _accessibilityState.busy,
        checked: ariaChecked ?? _accessibilityState.checked,
        disabled: ariaDisabled ?? _accessibilityState.disabled,
        expanded: ariaExpanded ?? _accessibilityState.expanded,
        selected: ariaSelected ?? _accessibilityState.selected,
      };
    } else {
      _accessibilityState = {
        busy: ariaBusy,
        checked: ariaChecked,
        disabled: ariaDisabled,
        expanded: ariaExpanded,
        selected: ariaSelected,
      };
    }
  }

  const _accessibilityStateDisabled = _accessibilityState?.disabled;
  const _disabled = disabled ?? _accessibilityStateDisabled;

  const isPressable =
    (onPress != null ||
      onLongPress != null ||
      onStartShouldSetResponder != null) &&
    _disabled !== true;

  const initialized = useLazyInitialization(isPressable);
  const config = useMemo(() => {
    if (!initialized) {
      return null;
    }

    let _onPressIn = onPressIn;
    let _onPressOut = onPressOut;

    // Updating isHighlighted causes unnecessary re-renders for platforms that don't use it
    // in the best case, and cause issues with text selection in the worst case. Forcing
    // the isHighlighted prop to false on all platforms except iOS.
    if (Platform.OS === 'ios') {
      _onPressIn = (event: PressEvent) => {
        setHighlighted(suppressHighlighting == null || !suppressHighlighting);
        onPressIn?.(event);
      };

      _onPressOut = (event: PressEvent) => {
        setHighlighted(false);
        onPressOut?.(event);
      };
    }

    return {
      disabled: !isPressable,
      pressRectOffset: pressRetentionOffset,
      onLongPress,
      onPress,
      onPressIn: _onPressIn,
      onPressOut: _onPressOut,
    };
  }, [
    initialized,
    isPressable,
    pressRetentionOffset,
    onLongPress,
    onPress,
    onPressIn,
    onPressOut,
    suppressHighlighting,
  ]);

  const eventHandlers = usePressability(config);
  const eventHandlersForText = useMemo(
    () =>
      eventHandlers == null
        ? null
        : {
            onResponderGrant(event: PressEvent) {
              eventHandlers.onResponderGrant(event);
              if (onResponderGrant != null) {
                onResponderGrant(event);
              }
            },
            onResponderMove(event: PressEvent) {
              eventHandlers.onResponderMove(event);
              if (onResponderMove != null) {
                onResponderMove(event);
              }
            },
            onResponderRelease(event: PressEvent) {
              eventHandlers.onResponderRelease(event);
              if (onResponderRelease != null) {
                onResponderRelease(event);
              }
            },
            onResponderTerminate(event: PressEvent) {
              eventHandlers.onResponderTerminate(event);
              if (onResponderTerminate != null) {
                onResponderTerminate(event);
              }
            },
            onClick: eventHandlers.onClick,
            onResponderTerminationRequest:
              onResponderTerminationRequest != null
                ? onResponderTerminationRequest
                : eventHandlers.onResponderTerminationRequest,
            onStartShouldSetResponder:
              onStartShouldSetResponder != null
                ? onStartShouldSetResponder
                : eventHandlers.onStartShouldSetResponder,
          },
    [
      eventHandlers,
      onResponderGrant,
      onResponderMove,
      onResponderRelease,
      onResponderTerminate,
      onResponderTerminationRequest,
      onStartShouldSetResponder,
    ],
  );

  // TODO: Move this processing to the view configuration.
  const _selectionColor =
    selectionColor == null ? null : processColor(selectionColor);

  let _style = style;
  if (__DEV__) {
    if (PressabilityDebug.isEnabled() && onPress != null) {
      _style = [style, {color: 'magenta'}];
    }
  }

  let _numberOfLines = numberOfLines;
  if (_numberOfLines != null && !(_numberOfLines >= 0)) {
    if (__DEV__) {
      console.error(
        `'numberOfLines' in <Text> must be a non-negative number, received: ${_numberOfLines}. The value will be set to 0.`,
      );
    }
    _numberOfLines = 0;
  }

  let _selectable = selectable;
  const processedStyle = flattenStyle(_style);
  if (processedStyle != null) {
    if (typeof processedStyle.fontWeight === 'number') {
      // $FlowFixMe[cannot-write]
      processedStyle.fontWeight = processedStyle.fontWeight.toString();
    }

    if (processedStyle.userSelect != null) {
      _selectable = userSelectToSelectableMap[processedStyle.userSelect];
      // $FlowFixMe[cannot-write]
      delete processedStyle.userSelect;
    }

    if (processedStyle.verticalAlign != null) {
      // $FlowFixMe[cannot-write]
      processedStyle.textAlignVertical =
        verticalAlignToTextAlignVerticalMap[processedStyle.verticalAlign];
      // $FlowFixMe[cannot-write]
      delete processedStyle.verticalAlign;
    }
  }

  const _nativeID = id ?? nativeID;

  const hasTextAncestor = useContext(TextAncestor);
  if (hasTextAncestor) {
    return (
      <NativeVirtualText
        {...restProps}
        {...eventHandlersForText}
        accessibilityLabel={_accessibilityLabel}
        accessibilityState={_accessibilityState}
        isHighlighted={isHighlighted}
        isPressable={isPressable}
        nativeID={_nativeID}
        numberOfLines={_numberOfLines}
        ref={forwardedRef}
        selectable={_selectable}
        selectionColor={_selectionColor}
        style={processedStyle}
        disabled={disabled}
      />
    );
  }

  // If the disabled prop and accessibilityState.disabled are out of sync but not both in
  // falsy states we need to update the accessibilityState object to use the disabled prop.
  if (
    _disabled !== _accessibilityStateDisabled &&
    ((_disabled != null && _disabled !== false) ||
      (_accessibilityStateDisabled != null &&
        _accessibilityStateDisabled !== false))
  ) {
    _accessibilityState = {..._accessibilityState, disabled: _disabled};
  }

  const _accessible = Platform.select({
    ios: accessible !== false,
    android:
      accessible == null ? onPress != null || onLongPress != null : accessible,
    default: accessible,
  });

  return (
    <TextAncestor.Provider value={true}>
      <NativeText
        {...restProps}
        {...eventHandlersForText}
        accessibilityLabel={_accessibilityLabel}
        accessibilityState={_accessibilityState}
        accessible={_accessible}
        allowFontScaling={allowFontScaling !== false}
        disabled={_disabled}
        ellipsizeMode={ellipsizeMode ?? 'tail'}
        isHighlighted={isHighlighted}
        nativeID={_nativeID}
        numberOfLines={_numberOfLines}
        ref={forwardedRef}
        selectable={_selectable}
        selectionColor={_selectionColor}
        style={processedStyle}
      />
    </TextAncestor.Provider>
  );
});

Text.displayName = 'Text';

/**
 * Returns false until the first time `newValue` is true, after which this will
 * always return true. This is necessary to lazily initialize `Pressability` so
 * we do not eagerly create one for every pressable `Text` component.
 */
function useLazyInitialization(newValue: boolean): boolean {
  const [oldValue, setValue] = useState(newValue);
  if (!oldValue && newValue) {
    setValue(newValue);
  }
  return oldValue;
}

const userSelectToSelectableMap = {
  auto: true,
  text: true,
  none: false,
  contain: true,
  all: true,
};

const verticalAlignToTextAlignVerticalMap = {
  auto: 'auto',
  top: 'top',
  bottom: 'bottom',
  middle: 'center',
};

module.exports = Text;
