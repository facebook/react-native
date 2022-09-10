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

export type DeviceStorageMethods = {
  setValueOnDevice: (key: string, value: string) => void,
  getValueOnDevice: (key: string) => ?string,
};

const methods: DeviceStorageMethods = {
  setValueOnDevice: (key, value) => {
    storage.set(key, value);
  },
  getValueOnDevice: key => {
    return storage.getString(key);
  },
};

module.exports = methods;
