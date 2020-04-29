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

import type {ComponentType} from 'react';
import * as React from 'react';

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

export type RNTesterExampleModuleItem = $ReadOnly<{|
  title: string,
  platform?: string,
  description?: string,
  render: () => React.Node,
|}>;

export type RNTesterExampleModule = $ReadOnly<{|
  title: string,
  description: string,
  displayName?: ?string,
  framework?: string,
  examples: Array<RNTesterExampleModuleItem>,
  simpleExampleContainer?: ?boolean,
|}>;

export type RNTesterExample = $ReadOnly<{|
  key: string,
  module: RNTesterExampleModule,
  supportsTVOS?: boolean,
|}>;
