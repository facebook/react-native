/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';

export type RNTesterModuleExample = $ReadOnly<{|
  name?: string,
  title: string,
  platform?: 'ios' | 'android',
  description?: string,
  render: () => React.Node,
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
  simpleExampleContainer?: ?boolean,
  category?: string,
  documentationURL?: string,
  showIndividualExamples?: boolean,
|}>;

export type RNTesterModuleInfo = $ReadOnly<{|
  key: string,
  module: RNTesterModule,
  category?: string,
  supportsTVOS?: boolean,
  documentationURL?: string,
  isBookmarked?: boolean,
  exampleType?: 'components' | 'apis',
|}>;

export type SectionData = {
  key: string,
  title: string,
  data: Array<RNTesterModuleInfo>,
};

export type ExamplesList = $ReadOnly<{|
  components: SectionData[],
  apis: SectionData[],
  bookmarks: SectionData[],
|}>;

export type ScreenTypes = 'components' | 'apis' | 'bookmarks' | null;

export type ComponentList = null | {components: string[], apis: string[]};

export type RNTesterState = {
  activeModuleKey: null | string,
  activeModuleTitle: null | string,
  activeModuleExampleKey: null | string,
  screen: ScreenTypes,
  bookmarks: ComponentList,
  recentlyUsed: ComponentList,
};
