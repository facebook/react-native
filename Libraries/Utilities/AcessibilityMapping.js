/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

// Map role values to AccessibilityRole values
export const roleToAccessibilityRoleMapping = {
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
