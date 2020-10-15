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

import * as React from 'react';

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
  documentationURL?: ?string,
  category?: ?string,
  framework?: string,
  examples: Array<RNTesterExampleModuleItem>,
  simpleExampleContainer?: ?boolean,
  category?: string,
  documentationURL?: string,
|}>;

export type RNTesterExample = $ReadOnly<{|
  key: string,
  module: RNTesterExampleModule,
  category?: string,
  supportsTVOS?: boolean,
  documentationURL?: string,
  isBookmarked?: boolean,
  exampleType?: 'components' | 'apis',
|}>;

export type SectionData = {
  key: string,
  title: string,
  data: Array<RNTesterExample>,
};

export type ExamplesList = $ReadOnly<{|
  components: SectionData[],
  apis: SectionData[],
  bookmarks: SectionData[],
|}>;

export type ScreenTypes = 'components' | 'apis' | 'bookmarks' | null;

export type ComponentList = null | {components: string[], apis: string[]};

export type RNTesterState = {
  openExample: null | string,
  screen: ScreenTypes,
  bookmarks: ComponentList,
  recentlyUsed: ComponentList,
};
