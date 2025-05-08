/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type AnimatedAddition from './nodes/AnimatedAddition';
import type AnimatedDiffClamp from './nodes/AnimatedDiffClamp';
import type AnimatedDivision from './nodes/AnimatedDivision';
import type AnimatedInterpolation from './nodes/AnimatedInterpolation';
import type AnimatedModulo from './nodes/AnimatedModulo';
import type AnimatedMultiplication from './nodes/AnimatedMultiplication';
import type AnimatedNode from './nodes/AnimatedNode';
import type {AnimatedPropsAllowlist} from './nodes/AnimatedProps';
import type AnimatedSubtraction from './nodes/AnimatedSubtraction';
import type AnimatedValue from './nodes/AnimatedValue';

import createAnimatedPropsHook from '../../src/private/animated/createAnimatedPropsHook';
import composeStyles from '../../src/private/styles/composeStyles';
import View from '../Components/View/View';
import useMergeRefs from '../Utilities/useMergeRefs';
import * as React from 'react';
import {useMemo} from 'react';

type Nullable = void | null;
type Primitive = string | number | boolean | symbol | void;
type Builtin = (...$ReadOnlyArray<empty>) => mixed | Date | Error | RegExp;

export type WithAnimatedValue<+T> = T extends Builtin | Nullable
  ? T
  : T extends Primitive
    ?
        | T
        | AnimatedNode
        | AnimatedAddition
        | AnimatedSubtraction
        | AnimatedDivision
        | AnimatedMultiplication
        | AnimatedModulo
        | AnimatedDiffClamp
        | AnimatedValue
        | AnimatedInterpolation<number | string>
        | AnimatedInterpolation<number>
        | AnimatedInterpolation<string>
    : T extends $ReadOnlyArray<infer P>
      ? $ReadOnlyArray<WithAnimatedValue<P>>
      : T extends {...}
        ? {+[K in keyof T]: WithAnimatedValue<T[K]>}
        : T;

type NonAnimatedProps =
  | 'ref'
  | 'innerViewRef'
  | 'scrollViewRef'
  | 'testID'
  | 'disabled'
  | 'accessibilityLabel';
type PassThroughProps = $ReadOnly<{
  passthroughAnimatedPropExplicitValues?: React.ElementConfig<
    typeof View,
  > | null,
}>;

export type AnimatedProps<Props: {...}> = {
  [K in keyof Props]: K extends NonAnimatedProps
    ? Props[K]
    : WithAnimatedValue<Props[K]>,
} & PassThroughProps;

export type AnimatedBaseProps<Props: {...}> = {
  [K in keyof Props]: K extends NonAnimatedProps
    ? Props[K]
    : WithAnimatedValue<Props[K]>,
};

export type AnimatedComponentType<Props: {...}, +Instance = mixed> = component(
  ref?: React.RefSetter<Instance>,
  ...AnimatedProps<Props>
);

export default function createAnimatedComponent<
  TInstance: React.ComponentType<any>,
>(
  Component: TInstance,
): AnimatedComponentType<
  $ReadOnly<React.ElementProps<TInstance>>,
  React.ElementRef<TInstance>,
> {
  return unstable_createAnimatedComponentWithAllowlist(Component, null);
}

export function unstable_createAnimatedComponentWithAllowlist<
  TProps: {...},
  TInstance: React.ComponentType<TProps>,
>(
  Component: TInstance,
  allowlist: ?AnimatedPropsAllowlist,
): AnimatedComponentType<TProps, React.ElementRef<TInstance>> {
  const useAnimatedProps = createAnimatedPropsHook(allowlist);

  const AnimatedComponent: AnimatedComponentType<
    TProps,
    React.ElementRef<TInstance>,
  > = React.forwardRef<AnimatedProps<TProps>, React.ElementRef<TInstance>>(
    (props, forwardedRef) => {
      const [reducedProps, callbackRef] = useAnimatedProps<
        TProps,
        React.ElementRef<TInstance>,
      >(props);
      const ref = useMergeRefs<React.ElementRef<TInstance>>(
        callbackRef,
        forwardedRef,
      );

      // Some components require explicit passthrough values for animation
      // to work properly. For example, if an animated component is
      // transformed and Pressable, onPress will not work after transform
      // without these passthrough values.
      // $FlowFixMe[prop-missing]
      const {passthroughAnimatedPropExplicitValues, style} = reducedProps;
      const passthroughStyle = passthroughAnimatedPropExplicitValues?.style;
      const mergedStyle = useMemo(
        () => composeStyles(style, passthroughStyle),
        [passthroughStyle, style],
      );

      // NOTE: It is important that `passthroughAnimatedPropExplicitValues` is
      // spread after `reducedProps` but before `style`.
      return (
        <Component
          {...reducedProps}
          {...passthroughAnimatedPropExplicitValues}
          style={mergedStyle}
          ref={ref}
        />
      );
    },
  );

  AnimatedComponent.displayName = `Animated(${
    Component.displayName || 'Anonymous'
  })`;

  return AnimatedComponent;
}
