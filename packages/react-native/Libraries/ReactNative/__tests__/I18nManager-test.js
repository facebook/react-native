/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {I18nManagerConstants} from '../NativeI18nManager';

let nativeConstants: I18nManagerConstants = {isRTL: false};

const nativeModule = {
  getConstants: jest.fn(() => nativeConstants),
  forceRTL: jest.fn(() => Promise.resolve()),
};

jest.mock('../NativeI18nManager', () => ({
  __esModule: true,
  default: nativeModule,
}));

describe('I18nManager', () => {
  it('updates the constants after forceRTL', async () => {
    const I18nManager = require('../I18nManager').default;

    nativeConstants = {isRTL: true};
    await I18nManager.forceRTL(true);

    expect(nativeModule.forceRTL).toHaveBeenCalledWith(true);
    expect(I18nManager.isRTL).toBe(true);
  });
});
