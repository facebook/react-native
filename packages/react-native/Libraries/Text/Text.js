/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TextStyleProp} from '../StyleSheet/StyleSheet';
import type {____TextStyle_Internal as TextStyleInternal} from '../StyleSheet/StyleSheetTypes';
import type {PressEvent} from '../Types/CoreEventTypes';
import type {NativeTextProps} from './TextNativeComponent';
import type {PressRetentionOffset, TextProps} from './TextProps';

import * as PressabilityDebug from '../Pressability/PressabilityDebug';
import usePressability from '../Pressability/usePressability';
import flattenStyle from '../StyleSheet/flattenStyle';
import processColor from '../StyleSheet/processColor';
import Platform from '../Utilities/Platform';
import TextAncestor from './TextAncestor';
import {NativeText, NativeVirtualText} from './TextNativeComponent';
import * as React from 'react';
import {useContext, useMemo, useState} from 'react';

type TextForwardRef = React.ElementRef<
  typeof NativeText | typeof NativeVirtualText,
>;

/**
 * Text is the fundamental component for displaying text.
 *
 * @see https://reactnative.dev/docs/text
 */
const Text: React.AbstractComponent<TextProps, TextForwardRef> =
  React.forwardRef(
    (
      {
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
        children,
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
      }: TextProps,
      forwardedRef,
    ) => {
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

      let processedStyle = flattenStyle<TextStyleProp>(_style);
      if (processedStyle != null) {
        let overrides: ?{...TextStyleInternal} = null;
        if (typeof processedStyle.fontWeight === 'number') {
          overrides = overrides || ({}: {...TextStyleInternal});
          overrides.fontWeight =
            // $FlowFixMe[incompatible-cast]
            (processedStyle.fontWeight.toString(): TextStyleInternal['fontWeight']);
        }

        if (processedStyle.userSelect != null) {
          _selectable = userSelectToSelectableMap[processedStyle.userSelect];
          overrides = overrides || ({}: {...TextStyleInternal});
          overrides.userSelect = undefined;
        }

        if (processedStyle.verticalAlign != null) {
          overrides = overrides || ({}: {...TextStyleInternal});
          overrides.textAlignVertical =
            verticalAlignToTextAlignVerticalMap[processedStyle.verticalAlign];
          overrides.verticalAlign = undefined;
        }

        if (overrides != null) {
          // $FlowFixMe[incompatible-type]
          _style = [_style, overrides];
        }
      }

      const _nativeID = id ?? nativeID;

      const hasTextAncestor = useContext(TextAncestor);
      if (hasTextAncestor) {
        if (isPressable) {
          return (
            <NativePressableVirtualText
              ref={forwardedRef}
              textProps={{
                ...restProps,
                accessibilityLabel: _accessibilityLabel,
                accessibilityState: _accessibilityState,
                nativeID: _nativeID,
                numberOfLines: _numberOfLines,
                selectable: _selectable,
                selectionColor: _selectionColor,
                style: _style,
                disabled: disabled,
                children,
              }}
              textPressabilityProps={{
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
                suppressHighlighting,
              }}
            />
          );
        }

        return (
          <NativeVirtualText
            {...restProps}
            accessibilityLabel={_accessibilityLabel}
            accessibilityState={_accessibilityState}
            isHighlighted={false}
            isPressable={false}
            nativeID={_nativeID}
            numberOfLines={_numberOfLines}
            ref={forwardedRef}
            selectable={_selectable}
            selectionColor={_selectionColor}
            style={_style}
            disabled={disabled}>
            {children}
          </NativeVirtualText>
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
          accessible == null
            ? onPress != null || onLongPress != null
            : accessible,
        default: accessible,
      });

      let nativeText = null;
      if (isPressable) {
        nativeText = (
          <NativePressableText
            ref={forwardedRef}
            textProps={{
              ...restProps,
              accessibilityLabel: _accessibilityLabel,
              accessibilityState: _accessibilityState,
              accessible: _accessible,
              allowFontScaling: allowFontScaling !== false,
              disabled: _disabled,
              ellipsizeMode: ellipsizeMode ?? 'tail',
              nativeID: _nativeID,
              numberOfLines: _numberOfLines,
              selectable: _selectable,
              selectionColor: _selectionColor,
              style: _style,
              children,
            }}
            textPressabilityProps={{
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
              suppressHighlighting,
            }}
          />
        );
      } else {
        nativeText = (
          <NativeText
            {...restProps}
            accessibilityLabel={_accessibilityLabel}
            accessibilityState={_accessibilityState}
            accessible={_accessible}
            allowFontScaling={allowFontScaling !== false}
            disabled={_disabled}
            ellipsizeMode={ellipsizeMode ?? 'tail'}
            isHighlighted={false}
            nativeID={_nativeID}
            numberOfLines={_numberOfLines}
            ref={forwardedRef}
            selectable={_selectable}
            selectionColor={_selectionColor}
            style={_style}>
            {children}
          </NativeText>
        );
      }

      if (children == null) {
        return nativeText;
      }

      // If the children do not contain a JSX element it would not be possible to have a
      // nested `Text` component so we can skip adding the `TextAncestor` context wrapper
      // which has a performance overhead. Since we do this for performance reasons we need
      // to keep the check simple to avoid regressing overall perf. For this reason the
      // `children.length` constant is set to `3`, this should be a reasonable tradeoff
      // to capture the majority of `Text` uses but also not make this check too expensive.
      if (Array.isArray(children) && children.length <= 3) {
        let hasNonTextChild = false;
        for (let child of children) {
          if (child != null && typeof child === 'object') {
            hasNonTextChild = true;
            break;
          }
        }
        if (!hasNonTextChild) {
          return nativeText;
        }
      } else if (typeof children !== 'object') {
        return nativeText;
      }

      return (
        <TextAncestor.Provider value={true}>{nativeText}</TextAncestor.Provider>
      );
    },
  );

Text.displayName = 'Text';

type TextPressabilityProps = $ReadOnly<{
  onLongPress?: ?(event: PressEvent) => mixed,
  onPress?: ?(event: PressEvent) => mixed,
  onPressIn?: ?(event: PressEvent) => mixed,
  onPressOut?: ?(event: PressEvent) => mixed,
  onResponderGrant?: ?(event: PressEvent) => void,
  onResponderMove?: ?(event: PressEvent) => void,
  onResponderRelease?: ?(event: PressEvent) => void,
  onResponderTerminate?: ?(event: PressEvent) => void,
  onResponderTerminationRequest?: ?() => boolean,
  onStartShouldSetResponder?: ?() => boolean,
  pressRetentionOffset?: ?PressRetentionOffset,
  suppressHighlighting?: ?boolean,
}>;

/**
 * Hook that handles setting up Pressability of Text components.
 *
 * NOTE: This hook is relatively expensive so it should only be used absolutely necessary.
 */
function useTextPressability({
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
  suppressHighlighting,
}: TextPressabilityProps) {
  const [isHighlighted, setHighlighted] = useState(false);

  // Setup pressability config and wrap callbacks needs to track the highlight state.
  const config = useMemo(() => {
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
      disabled: false,
      pressRectOffset: pressRetentionOffset,
      onLongPress,
      onPress,
      onPressIn: _onPressIn,
      onPressOut: _onPressOut,
    };
  }, [
    pressRetentionOffset,
    onLongPress,
    onPress,
    onPressIn,
    onPressOut,
    suppressHighlighting,
  ]);

  // Init the pressability class
  const eventHandlers = usePressability(config);

  // Create NativeText event handlers which proxy events to pressability
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

  // Return the highlight state and NativeText event handlers
  return useMemo(
    () => [isHighlighted, eventHandlersForText],
    [isHighlighted, eventHandlersForText],
  );
}

type NativePressableTextProps = $ReadOnly<{
  textProps: NativeTextProps,
  textPressabilityProps: TextPressabilityProps,
}>;

/**
 * Wrap the NativeVirtualText component and initialize pressability.
 *
 * This logic is split out from the main Text component to enable the more
 * expensive pressability logic to be only initialized when needed.
 */
const NativePressableVirtualText: React.AbstractComponent<
  NativePressableTextProps,
  TextForwardRef,
> = React.forwardRef(({textProps, textPressabilityProps}, forwardedRef) => {
  const [isHighlighted, eventHandlersForText] = useTextPressability(
    textPressabilityProps,
  );

  return (
    <NativeVirtualText
      {...textProps}
      {...eventHandlersForText}
      isHighlighted={isHighlighted}
      isPressable={true}
      ref={forwardedRef}
    />
  );
});

/**
 * Wrap the NativeText component and initialize pressability.
 *
 * This logic is split out from the main Text component to enable the more
 * expensive pressability logic to be only initialized when needed.
 */
const NativePressableText: React.AbstractComponent<
  NativePressableTextProps,
  TextForwardRef,
> = React.forwardRef(({textProps, textPressabilityProps}, forwardedRef) => {
  const [isHighlighted, eventHandlersForText] = useTextPressability(
    textPressabilityProps,
  );

  return (
    <NativeText
      {...textProps}
      {...eventHandlersForText}
      isHighlighted={isHighlighted}
      isPressable={true}
      ref={forwardedRef}
    />
  );
});

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
