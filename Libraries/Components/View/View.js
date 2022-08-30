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
> = React.forwardRef((props: ViewProps, forwardedRef) => {
  const {
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-selected': ariaSelected,
    accessibilityState,
    ...restProps
  } = props;

  const _accessibilityState = {
    busy: ariaBusy ?? accessibilityState?.busy,
    checked: ariaChecked ?? accessibilityState?.checked,
    disabled: ariaDisabled ?? accessibilityState?.disabled,
    expanded: ariaExpanded ?? accessibilityState?.expanded,
    selected: ariaSelected ?? accessibilityState?.selected,
  };

  /**
   * Removing undefined keys from _accessibilityState
   */

  Object.keys(_accessibilityState).forEach(key => {
    if (_accessibilityState[key] === undefined) {
      delete _accessibilityState[key];
    }
  });

  return (
    <TextAncestor.Provider value={false}>
      <ViewNativeComponent
        accessibilityState={_accessibilityState}
        {...restProps}
        ref={forwardedRef}
      />
    </TextAncestor.Provider>
  );
});

View.displayName = 'View';

module.exports = View;
