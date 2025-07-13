/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';

export type NewAppScreenProps = Readonly<{
  templateFileName?: string | undefined;
  safeAreaInsets?:
    | Readonly<{
        top: number;
        bottom: number;
        left: number;
        right: number;
      }>
    | undefined;
}>;

export function NewAppScreen(props: NewAppScreenProps): React.ReactNode;
