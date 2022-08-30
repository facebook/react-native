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
    let restProps = {...otherProps};

    // Map role values to AccessibilityRole values
    const roleToAccessibilityRoleMapping = {
      alert: 'alert',
      button: 'button',
      checkbox: 'checkbox',
      combobox: 'combobox',
      grid: 'grid',
      heading: 'header',
      img: 'image',
      link: 'link',
      list: 'list',
      menu: 'menu',
      menubar: 'menubar',
      menuitem: 'menuitem',
      none: 'none',
      presentation: 'none',
      progressbar: 'progressbar',
      radio: 'radio',
      radiogroup: 'radiogroup',
      scrollbar: 'scrollbar',
      searchbox: 'search',
      slider: 'adjustable',
      spinbutton: 'spinbutton',
      summary: 'summary',
      switch: 'switch',
      tab: 'tab',
      tablist: 'tablist',
      timer: 'timer',
      toolbar: 'toolbar',
      tooltip: undefined,
      feed: undefined,
      math: undefined,
      note: undefined,
      application: undefined,
      article: undefined,
      cell: undefined,
      columnheader: undefined,
      definition: undefined,
      directory: undefined,
      document: undefined,
      figure: undefined,
      group: undefined,
      listitem: undefined,
      meter: undefined,
      row: undefined,
      rowgroup: undefined,
      rowheader: undefined,
      separator: undefined,
      table: undefined,
      term: undefined,
      separator: undefined,
      tabpanel: undefined,
      treeitem: undefined,
      tree: undefined,
      treegrid: undefined,
      banner: undefined,
      complementary: undefined,
      contentinfo: undefined,
      form: undefined,
      main: undefined,
      navigation: undefined,
      region: undefined,
      log: undefined,
      marquee: undefined,
      status: undefined,
      alertdialog: undefined,
      dialog: undefined,
    };

    const _accessibilityRole = role
      ? roleToAccessibilityRoleMapping[role]
      : accessibilityRole;

    // set restProps is _accessibilityRole exists
    if (_accessibilityRole) {
      restProps = {...restProps, accessibilityRole: _accessibilityRole};
    }

    return (
      <TextAncestor.Provider value={false}>
        <ViewNativeComponent
          focusable={tabIndex !== undefined ? !tabIndex : focusable}
          {...restProps}
          ref={forwardedRef}
        />
      </TextAncestor.Provider>
    );
  },
);

View.displayName = 'View';

module.exports = View;
