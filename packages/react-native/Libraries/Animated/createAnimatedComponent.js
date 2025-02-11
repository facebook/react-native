/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {AnimatedPropsAllowlist} from './nodes/AnimatedProps';

import createAnimatedPropsHook from '../../src/private/animated/createAnimatedPropsHook';
import composeStyles from '../../src/private/styles/composeStyles';
import View from '../Components/View/View';
import useMergeRefs from '../Utilities/useMergeRefs';
import * as React from 'react';
import {useMemo} from 'react';

export type AnimatedProps<Props: {...}> = {
  // eslint-disable-next-line no-unused-vars
  +[_K in keyof (Props &
      $ReadOnly<{
        passthroughAnimatedPropExplicitValues?: React.ElementConfig<
          typeof View,
        >,
      }>)]: any,
};

// We could use a mapped type here to introduce acceptable Animated variants
// of properties, instead of doing so in the core StyleSheetTypes
// Inexact Props are not supported, they'll be made exact here.
export type StrictAnimatedProps<Props: {...}> = $ReadOnly<{
  ...$Exact<Props>,
  passthroughAnimatedPropExplicitValues?: ?Props,
}>;

export type AnimatedComponentType<Props: {...}, +Instance = mixed> = component(
  ref: React.RefSetter<Instance>,
  ...AnimatedProps<Props>
);

export type StrictAnimatedComponentType<
  Props: {...},
  +Instance = mixed,
> = component(ref: React.RefSetter<Instance>, ...StrictAnimatedProps<Props>);

export default function createAnimatedComponent<TProps: {...}, TInstance>(
  Component: component(ref: React.RefSetter<TInstance>, ...TProps),
): AnimatedComponentType<TProps, TInstance> {
  return unstable_createAnimatedComponentWithAllowlist(Component, null);
}

export function unstable_createAnimatedComponentWithAllowlist<
  TProps: {...},
  TInstance,
>(
  Component: component(ref: React.RefSetter<TInstance>, ...TProps),
  allowlist: ?AnimatedPropsAllowlist,
): StrictAnimatedComponentType<TProps, TInstance> {
  const useAnimatedProps = createAnimatedPropsHook(allowlist);

  const AnimatedComponent = React.forwardRef<
    StrictAnimatedProps<TProps>,
    TInstance,
  >((props, forwardedRef) => {
    const [reducedProps, callbackRef] = useAnimatedProps<TProps, TInstance>(
      props,
    );
    const ref = useMergeRefs<TInstance>(callbackRef, forwardedRef);

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
  });

  AnimatedComponent.displayName = `Animated(${
    Component.displayName || 'Anonymous'
  })`;

  return AnimatedComponent;
}
