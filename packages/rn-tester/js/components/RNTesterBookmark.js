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

export type RNTesterBookmark = {
  Components: Object,
  Api: Object,
  AddComponent: Function,
  RemoveComponent: Function,
  AddApi: Function,
  RemoveApi: Function,
  checkBookmark: Function,
};

export const bookmarks = {
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
