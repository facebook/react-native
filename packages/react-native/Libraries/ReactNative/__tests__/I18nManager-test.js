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

let nativeConstants: I18nManagerConstants;
let nativeModule: $FlowFixMe;

function requireI18nManager() {
  jest.resetModules();
  jest.doMock('../NativeI18nManager', () => ({
    __esModule: true,
    default: nativeModule,
  }));
  return require('../I18nManager').default;
}

describe('I18nManager', () => {
  beforeEach(() => {
    nativeConstants = {isRTL: false, doLeftAndRightSwapInRTL: true};
    nativeModule = {
      getConstants: jest.fn(() => nativeConstants),
      relayout: jest.fn(() => Promise.resolve()),
    };
  });

  it('updates the constants and emits change after relayout', async () => {
    const I18nManager = requireI18nManager();
    const handler = jest.fn();
    I18nManager.addEventListener('change', handler);

    nativeConstants = {isRTL: true, doLeftAndRightSwapInRTL: false};
    await I18nManager.relayout();

    const expected = {
      isRTL: true,
      doLeftAndRightSwapInRTL: false,
      localeIdentifier: undefined,
    };

    expect(I18nManager.isRTL).toBe(true);
    expect(I18nManager.doLeftAndRightSwapInRTL).toBe(false);
    expect(I18nManager.getConstants()).toEqual(expected);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expected);
  });

  it('does not emit change when no constant changed', async () => {
    const I18nManager = requireI18nManager();
    const handler = jest.fn();

    I18nManager.addEventListener('change', handler);
    await I18nManager.relayout();
    expect(handler).not.toHaveBeenCalled();
  });

  it('resolves when the native module has no relayout', async () => {
    delete nativeModule.relayout;

    const I18nManager = requireI18nManager();
    await expect(I18nManager.relayout()).resolves.toBeUndefined();
  });
});
