/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {ComponentType} from 'React';

export type RNTesterProps = $ReadOnly<{|
  navigator?: ?$ReadOnlyArray<
    $ReadOnly<{|
      title: string,
      component: ComponentType<any>,
      backButtonTitle: string,
      passProps: any,
    |}>,
  >,
|}>;
