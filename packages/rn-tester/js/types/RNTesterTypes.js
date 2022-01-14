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

// TODO(macOS GH#774) - useful since RNTesterModuleExample.platform can either be
// one of these strings or an array of said strings
type RNTesterPlatform = 'ios' | 'android' | 'macos';

export type RNTesterModuleExample = $ReadOnly<{|
  name?: string,
  title: string,
  platform?: RNTesterPlatform | Array<RNTesterPlatform>, // TODO(OSS Candidate ISS#2710739)
  description?: string,
  expect?: string,
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
  category?: string,
  documentationURL?: string,
  showIndividualExamples?: boolean,
|}>;

export type RNTesterModuleInfo = $ReadOnly<{|
  key: string,
  module: RNTesterModule,
  skipTest?: {
    ios?: string,
    macos?: string,
    default?: string,
  }, // TODO(OSS Candidate ISS#2710739)
  category?: string,
  supportsTVOS?: boolean,
  documentationURL?: string,
  isBookmarked?: boolean,
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
  bookmarks: $ReadOnlyArray<SectionData<RNTesterModuleInfo>>,
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
