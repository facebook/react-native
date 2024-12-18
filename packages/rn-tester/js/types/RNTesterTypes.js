/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import * as React from 'react';

export type RNTesterModuleExample = $ReadOnly<{|
  name?: string,
  title: string,
  platform?: 'ios' | 'android',
  description?: string,
  expect?: string,
  hidden?: boolean,
  scrollable?: boolean,
  render: ({testID?: ?string}) => React.Node,
|}>;

export type RNTesterModule = $ReadOnly<{|
  title: string,
  testTitle?: ?string,
  description: string,
  displayName?: ?string,
  documentationURL?: ?string,
  category?: ?string,
  framework?: string,
  examples: Array<RNTesterModuleExample>,
  category?: string,
  documentationURL?: string,
  showIndividualExamples?: boolean,
|}>;

export type RNTesterModuleInfo = $ReadOnly<{|
  key: string,
  module: RNTesterModule,
  category?: string,
  documentationURL?: string,
  exampleType?: 'components' | 'apis',
|}>;

export type SectionData<T> = {
  key: string,
  title: string,
  data: Array<T>,
};

export type ExamplesList = $ReadOnly<{|
  components: $ReadOnlyArray<SectionData<RNTesterModuleInfo>>,
  apis: $ReadOnlyArray<SectionData<RNTesterModuleInfo>>,
|}>;

export type ScreenTypes = 'components' | 'apis' | 'playgrounds' | null;

export type ComponentList = null | {components: string[], apis: string[]};

export type RNTesterNavigationState = {
  activeModuleKey: null | string,
  activeModuleTitle: null | string,
  activeModuleExampleKey: null | string,
  screen: ScreenTypes,
  recentlyUsed: ComponentList,
  hadDeepLink: boolean,
};

export type RNTesterJsStallsState = {
  stallIntervalId: ?IntervalID,
  busyTime: null | number,
  filteredStall: number,
  tracking: boolean,
};
