/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';

type PopupMenuAndroidInstance = {
  readonly show: () => void;
};

type Props = {
  menuItems: Array<string>;
  onSelectionChange: (number) => void;
  onDismiss: () => void;
  children: React.ReactNode | undefined;
  instanceRef: React.RefObject<PopupMenuAndroidInstance>;
};

declare class PopupMenuAndroid extends React.Component<Props> {}
