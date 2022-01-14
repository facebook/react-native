/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import DeprecatedTextPropTypes from '../DeprecatedPropTypes/DeprecatedTextPropTypes';
import * as PressabilityDebug from '../Pressability/PressabilityDebug';
import usePressability from '../Pressability/usePressability';
import StyleSheet from '../StyleSheet/StyleSheet';
import processColor from '../StyleSheet/processColor';
import TextAncestor from './TextAncestor';
import {NativeText, NativeVirtualText} from './TextNativeComponent';
import {type TextProps} from './TextProps';
import * as React from 'react';
import {useContext, useMemo, useState} from 'react';
import invariant from 'invariant';

/**
 * Text is the fundamental component for displaying text.
 *
 * @see https://reactnative.dev/docs/text.html
 */
const Text: React.AbstractComponent<
  TextProps,
  React.ElementRef<typeof NativeText | typeof NativeVirtualText>,
> = React.forwardRef((props: TextProps, forwardedRef) => {
  const {
    accessible,
    allowFontScaling,
    ellipsizeMode,
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
    ...restProps
  } = props;

  const [isHighlighted, setHighlighted] = useState(false);

  const isPressable =
    (onPress != null ||
      onLongPress != null ||
      onStartShouldSetResponder != null) &&
    restProps.disabled !== true;

  const initialized = useLazyInitialization(isPressable);
  const config = useMemo(
    () =>
      initialized
        ? {
            disabled: !isPressable,
            pressRectOffset: pressRetentionOffset,
            onLongPress,
            onPress,
            onPressIn(event) {
              setHighlighted(!suppressHighlighting);
              onPressIn?.(event);
            },
            onPressOut(event) {
              setHighlighted(false);
              onPressOut?.(event);
            },
            onResponderTerminationRequest_DEPRECATED: onResponderTerminationRequest,
            onStartShouldSetResponder_DEPRECATED: onStartShouldSetResponder,
          }
        : null,
    [
      initialized,
      isPressable,
      pressRetentionOffset,
      onLongPress,
      onPress,
      onPressIn,
      onPressOut,
      onResponderTerminationRequest,
      onStartShouldSetResponder,
      suppressHighlighting,
    ],
  );

  const eventHandlers = usePressability(config);
  const eventHandlersForText = useMemo(
    () =>
      eventHandlers == null
        ? null
        : {
            onResponderGrant(event) {
              eventHandlers.onResponderGrant(event);
              if (onResponderGrant != null) {
                onResponderGrant(event);
              }
            },
            onResponderMove(event) {
              eventHandlers.onResponderMove(event);
              if (onResponderMove != null) {
                onResponderMove(event);
              }
            },
            onResponderRelease(event) {
              eventHandlers.onResponderRelease(event);
              if (onResponderRelease != null) {
                onResponderRelease(event);
              }
            },
            onResponderTerminate(event) {
              eventHandlers.onResponderTerminate(event);
              if (onResponderTerminate != null) {
                onResponderTerminate(event);
              }
            },
            onResponderTerminationRequest:
              eventHandlers.onResponderTerminationRequest,
            onStartShouldSetResponder: eventHandlers.onStartShouldSetResponder,
          },
    [
      eventHandlers,
      onResponderGrant,
      onResponderMove,
      onResponderRelease,
      onResponderTerminate,
    ],
  );

  // TODO: Move this processing to the view configuration.
  const selectionColor =
    restProps.selectionColor == null
      ? null
      : processColor(restProps.selectionColor);

  let style = restProps.style;
  if (__DEV__) {
    if (PressabilityDebug.isEnabled() && onPress != null) {
      style = StyleSheet.compose(restProps.style, {
        color: 'magenta',
      });
    }
  }

  let numberOfLines = restProps.numberOfLines;
  if (numberOfLines != null && !(numberOfLines >= 0)) {
    console.error(
      `'numberOfLines' in <Text> must be a non-negative number, received: ${numberOfLines}. The value will be set to 0.`,
    );
    numberOfLines = 0;
  }

  const hasTextAncestor = useContext(TextAncestor);

  return hasTextAncestor ? (
    <NativeVirtualText
      {...restProps}
      {...eventHandlersForText}
      isHighlighted={isHighlighted}
      numberOfLines={numberOfLines}
      selectionColor={selectionColor}
      style={style}
      ref={forwardedRef}
    />
  ) : (
    <TextAncestor.Provider value={true}>
      <NativeText
        {...restProps}
        {...eventHandlersForText}
        accessible={accessible !== false}
        allowFontScaling={allowFontScaling !== false}
        ellipsizeMode={ellipsizeMode ?? 'tail'}
        isHighlighted={isHighlighted}
        numberOfLines={numberOfLines}
        selectionColor={selectionColor}
        style={style}
        ref={forwardedRef}
      />
    </TextAncestor.Provider>
  );
});

Text.displayName = 'Text';

// TODO: Delete this.
Text.propTypes = DeprecatedTextPropTypes;

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

// $FlowFixMe[incompatible-cast] - No good way to type a React.AbstractComponent with statics.
module.exports = (Text: typeof Text &
  $ReadOnly<{
    propTypes: typeof DeprecatedTextPropTypes,
  }>);
