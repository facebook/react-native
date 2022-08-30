/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from './ViewPropTypes';

import ViewNativeComponent from './ViewNativeComponent';
import TextAncestor from '../../Text/TextAncestor';
import * as React from 'react';

export type Props = ViewProps;

/**
 * The most fundamental component for building a UI, View is a container that
 * supports layout with flexbox, style, some touch handling, and accessibility
 * controls.
 *
 * @see https://reactnative.dev/docs/view
 */
const View: React.AbstractComponent<
  ViewProps,
  React.ElementRef<typeof ViewNativeComponent>,
> = React.forwardRef(
  (
    {tabIndex, focusable, role, accessibilityRole, ...otherProps}: ViewProps,
    forwardedRef,
  ) => {
    // Map role values to AccessibilityRole values
    const roleToAccessibilityRoleMapping = {
      slider: 'adjustable',
      img: 'image',
      presentation: 'none',
      summary: 'region',
    };

    const _accessibilityRole =
      roleToAccessibilityRoleMapping[role] ?? accessibilityRole;

    return (
      <TextAncestor.Provider value={false}>
        <ViewNativeComponent
          focusable={tabIndex !== undefined ? !tabIndex : focusable}
          accessibilityRole={_accessibilityRole}
          {...otherProps}
          ref={forwardedRef}
        />
      </TextAncestor.Provider>
    );
  },
);

View.displayName = 'View';

module.exports = View;
