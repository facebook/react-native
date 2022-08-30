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
  ({tabIndex, focusable, ...otherProps}: ViewProps, forwardedRef) => {
    const {
      'aria-busy': ariaBusy,
      'aria-checked': ariaChecked,
      'aria-disabled': ariaDisabled,
      'aria-expanded': ariaExpanded,
      'aria-selected': ariaSelected,
      ...restProps
    } = otherProps;

    const _accessibilityState = {
      busy: ariaBusy ?? otherProps.accessibilityState?.busy,
      checked: ariaChecked ?? otherProps.accessibilityState?.checked,
      disabled: ariaDisabled ?? otherProps.accessibilityState?.disabled,
      expanded: ariaExpanded ?? otherProps.accessibilityState?.expanded,
      selected: ariaSelected ?? otherProps.accessibilityState?.selected,
    };

    /**
     * Removing undefined keys from _accessibilityState
     */

    Object.keys(_accessibilityState).forEach(key => {
      if (_accessibilityState[key] === undefined) {
        delete _accessibilityState[key];
      }
    });

    let restWithDefaultProps = {...restProps};

    if (Object.keys(_accessibilityState).length !== 0) {
      restWithDefaultProps = {
        ...restWithDefaultProps,
        accessibilityState: _accessibilityState,
      };
    }

    return (
      <TextAncestor.Provider value={false}>
        <ViewNativeComponent
          focusable={tabIndex !== undefined ? !tabIndex : focusable}
          {...restWithDefaultProps}
          ref={forwardedRef}
        />
      </TextAncestor.Provider>
    );
  },
);

View.displayName = 'View';

module.exports = View;
