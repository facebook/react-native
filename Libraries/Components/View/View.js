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
import flattenStyle from '../../StyleSheet/flattenStyle';
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
    {
      accessibilityElementsHidden,
      accessibilityRole,
      'aria-hidden': ariaHidden,
      focusable,
      importantForAccessibility,
      pointerEvents,
      role,
      style,
      tabIndex,
      ...otherProps
    }: ViewProps,
    forwardedRef,
  ) => {
    const {
      accessibilityState,
      'aria-busy': ariaBusy,
      'aria-checked': ariaChecked,
      'aria-disabled': ariaDisabled,
      'aria-expanded': ariaExpanded,
      'aria-selected': ariaSelected,
      ...restProps
    } = otherProps;

    const _accessibilityState = {
      busy: ariaBusy ?? accessibilityState?.busy,
      checked: ariaChecked ?? accessibilityState?.checked,
      disabled: ariaDisabled ?? accessibilityState?.disabled,
      expanded: ariaExpanded ?? accessibilityState?.expanded,
      selected: ariaSelected ?? accessibilityState?.selected,
    };

    // Map role values to AccessibilityRole values
    const roleToAccessibilityRoleMapping = {
      alert: 'alert',
      alertdialog: undefined,
      application: undefined,
      article: undefined,
      banner: undefined,
      button: 'button',
      cell: undefined,
      checkbox: 'checkbox',
      columnheader: undefined,
      combobox: 'combobox',
      complementary: undefined,
      contentinfo: undefined,
      definition: undefined,
      dialog: undefined,
      directory: undefined,
      document: undefined,
      feed: undefined,
      figure: undefined,
      form: undefined,
      grid: 'grid',
      group: undefined,
      heading: 'header',
      img: 'image',
      link: 'link',
      list: 'list',
      listitem: undefined,
      log: undefined,
      main: undefined,
      marquee: undefined,
      math: undefined,
      menu: 'menu',
      menubar: 'menubar',
      menuitem: 'menuitem',
      meter: undefined,
      navigation: undefined,
      none: 'none',
      note: undefined,
      presentation: 'none',
      progressbar: 'progressbar',
      radio: 'radio',
      radiogroup: 'radiogroup',
      region: undefined,
      row: undefined,
      rowgroup: undefined,
      rowheader: undefined,
      scrollbar: 'scrollbar',
      searchbox: 'search',
      separator: undefined,
      slider: 'adjustable',
      spinbutton: 'spinbutton',
      status: undefined,
      summary: 'summary',
      switch: 'switch',
      tab: 'tab',
      table: undefined,
      tablist: 'tablist',
      tabpanel: undefined,
      term: undefined,
      timer: 'timer',
      toolbar: 'toolbar',
      tooltip: undefined,
      tree: undefined,
      treegrid: undefined,
      treeitem: undefined,
    };

    const flattenedStyle = flattenStyle(style);
    const newPointerEvents = flattenedStyle?.pointerEvents || pointerEvents;

    return (
      <TextAncestor.Provider value={false}>
        <ViewNativeComponent
          focusable={tabIndex !== undefined ? !tabIndex : focusable}
          accessibilityState={_accessibilityState}
          accessibilityRole={
            role ? roleToAccessibilityRoleMapping[role] : accessibilityRole
          }
          accessibilityElementsHidden={
            ariaHidden ?? accessibilityElementsHidden
          }
          importantForAccessibility={
            ariaHidden === true
              ? 'no-hide-descendants'
              : importantForAccessibility
          }
          {...restProps}
          style={style}
          pointerEvents={newPointerEvents}
          ref={forwardedRef}
        />
      </TextAncestor.Provider>
    );
  },
);

View.displayName = 'View';

module.exports = View;
