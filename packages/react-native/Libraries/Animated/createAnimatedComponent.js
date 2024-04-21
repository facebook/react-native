/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import View from '../Components/View/View';
import useMergeRefs from '../Utilities/useMergeRefs';
import useAnimatedProps from './useAnimatedProps';
import * as React from 'react';

// $FlowFixMe[deprecated-type]
export type AnimatedProps<Props: {...}> = $ObjMap<
  Props &
    $ReadOnly<{
      passthroughAnimatedPropExplicitValues?: React.ElementConfig<typeof View>,
    }>,
  () => any,
>;

export type AnimatedComponentType<
  Props: {...},
  +Instance = mixed,
> = React.AbstractComponent<AnimatedProps<Props>, Instance>;

export default function createAnimatedComponent<TProps: {...}, TInstance>(
  Component: React.AbstractComponent<TProps, TInstance>,
): AnimatedComponentType<TProps, TInstance> {
  const AnimatedComponent = React.forwardRef<AnimatedProps<TProps>, TInstance>(
    (props, forwardedRef) => {
      const [reducedProps, callbackRef] = useAnimatedProps<TProps, TInstance>(
        // $FlowFixMe[incompatible-call]
        props,
      );
      const ref = useMergeRefs<TInstance>(callbackRef, forwardedRef);

      // Some components require explicit passthrough values for animation
      // to work properly. For example, if an animated component is
      // transformed and Pressable, onPress will not work after transform
      // without these passthrough values.
      // $FlowFixMe[prop-missing]
      const {passthroughAnimatedPropExplicitValues, style} = reducedProps;
      const {style: passthroughStyle, ...passthroughProps} =
        passthroughAnimatedPropExplicitValues ?? {};
      const mergedStyle = {...style, ...passthroughStyle};

      return (
        <Component
          {...reducedProps}
          {...passthroughProps}
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
