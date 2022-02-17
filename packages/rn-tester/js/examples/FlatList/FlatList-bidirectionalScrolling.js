/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import typeof FlatListType from 'react-native/Libraries/Lists/FlatList';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import * as React from 'react';

import RNTesterPage from '../../components/RNTesterPage';
import infoLog from 'react-native/Libraries/Utilities/infoLog';

import {
  FooterComponent,
  HeaderComponent,
  ItemComponent,
  ListEmptyComponent,
  ItemSeparatorComponent,
  PlainInput,
  SeparatorComponent,
  Spindicator,
  genNewerItems,
  genOlderItems,
  getItemLayout,
  pressItem,
  renderSmallSwitchOption,
} from '../../components/ListExampleShared';

import type {Item} from '../../components/ListExampleShared';

type Props = $ReadOnly<{||}>;
type State = {|
  data: Array<Item>,
  debug: boolean,
  horizontal: boolean,
  inverted: boolean,
  fixedHeight: boolean,
  logViewable: boolean,
  useFlatListItemComponent: boolean,
  fadingEdgeLength: number,
  onPressDisabled: boolean,
  textSelectable: boolean,
|};
