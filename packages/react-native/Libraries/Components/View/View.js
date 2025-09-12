/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from './ViewPropTypes';

import TextAncestorContext from '../../Text/TextAncestorContext';
import {extractAccessibilityProps} from './ViewAccessibilityUtils';
import ViewNativeComponent from './ViewNativeComponent';
import * as React from 'react';
import {use} from 'react';

/**
 * The most fundamental component for building a UI, View is a container that
 * supports layout with flexbox, style, some touch handling, and accessibility
 * controls.
 *
 * @see https://reactnative.dev/docs/view
 */
component View(
  ref?: React.RefSetter<React.ElementRef<typeof ViewNativeComponent>>,
  ...props: ViewProps
) {
  const [accessibilityProps, otherProps] =
    extractAccessibilityProps<ViewProps>(props);

  const {id, tabIndex, ...processedProps} = otherProps;

  if (id !== undefined) {
    processedProps.nativeID = id;
  }

  if (tabIndex !== undefined) {
    processedProps.focusable = !tabIndex;
  }

  let finalProps: ViewProps = {
    ...accessibilityProps,
    ...processedProps,
  };

  const actualView =
    ref == null ? (
      <ViewNativeComponent {...finalProps} />
    ) : (
      <ViewNativeComponent {...finalProps} ref={ref} />
    );

  const hasTextAncestor = use(TextAncestorContext);
  if (hasTextAncestor) {
    return (
      <TextAncestorContext value={false}>{actualView}</TextAncestorContext>
    );
  } else {
    return actualView;
  }
}

View.displayName = 'View';

export default View;
