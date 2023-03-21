/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import StyleSheet from '../StyleSheet/StyleSheet';
import useMergeRefs from '../Utilities/useMergeRefs';
import useAnimatedProps from './useAnimatedProps';
import * as React from 'react';

/**
 * Experimental implementation of `createAnimatedComponent` that is intended to
 * be compatible with concurrent rendering.
 */
export default function createAnimatedComponent<TProps: {...}, TInstance>(
  Component: React.AbstractComponent<TProps, TInstance>,
): React.AbstractComponent<TProps, TInstance> {
  return React.forwardRef((props, forwardedRef) => {
    const [reducedProps, callbackRef] = useAnimatedProps<TProps, TInstance>(
      props,
    );
    const ref = useMergeRefs<TInstance | null>(callbackRef, forwardedRef);

    // Some components require explicit passthrough values for animation
    // to work properly. For example, if an animated component is
    // transformed and Pressable, onPress will not work after transform
    // without these passthrough values.
    // $FlowFixMe[prop-missing]
    const {passthroughAnimatedPropExplicitValues, style} = reducedProps;
    const {style: passthroughStyle, ...passthroughProps} =
      passthroughAnimatedPropExplicitValues ?? {};
    const mergedStyle = StyleSheet.compose(style, passthroughStyle);

    return (
      <Component
        {...reducedProps}
        {...passthroughProps}
        style={mergedStyle}
        ref={ref}
      />
    );
  });
}
