/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import * as React from 'react';
import type {RNTesterExample} from '../types/RNTesterTypes';

export type RNTesterBookmark = {
  Components: {...},
  Api: {...},
  AddApi: (apiName: string, api: RNTesterExample) => mixed,
  AddComponent: (componentName: string, component: RNTesterExample) => mixed,
  RemoveApi: (apiName: string) => mixed,
  RemoveComponent: (componentName: string) => mixed,
  checkBookmark: (title: string, key: string) => mixed,
};

export const bookmarks: RNTesterBookmark = {
  Components: {},
  Api: {},
  AddComponent: () => {},
  RemoveComponent: () => {},
  AddApi: () => {},
  RemoveApi: () => {},
  checkBookmark: () => {},
};

export const RNTesterBookmarkContext: React.Context<RNTesterBookmark> = React.createContext(
  bookmarks,
);
