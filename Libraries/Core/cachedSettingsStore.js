/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import {MMKV} from 'react-native-mmkv';

const storage = new MMKV({
  id: 'ReactDevTools',
});
const SETTINGS_KEY = 'Settings';

export type CachedSettingsStore = {
  getValue: () => string,
  setValue: (newValue: string) => void,
};
const cachedSettingsStore: CachedSettingsStore = {
  getValue: () => storage.getString(SETTINGS_KEY),
  setValue: settingsString => {
    storage.set(SETTINGS_KEY, settingsString);
  },
};

module.exports = cachedSettingsStore;
