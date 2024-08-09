/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {RefObject} from 'react';
import type {Node} from 'react';

import * as React from 'react';

const UnimplementedView = require('../UnimplementedViews/UnimplementedView');

export type PopupMenuAndroidInstance = {
  +show: () => void,
};

type Props = {
  menuItems: $ReadOnlyArray<string>,
  onSelectionChange: number => void,
  children: Node,
  instanceRef: RefObject<?PopupMenuAndroidInstance>,
};

function PopupMenuAndroid(props: Props): Node {
  return <UnimplementedView />;
}

export default PopupMenuAndroid;
