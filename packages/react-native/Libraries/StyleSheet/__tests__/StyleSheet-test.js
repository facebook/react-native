/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import StyleSheet from '../StyleSheet';

const setStyleAttributePreprocessor = StyleSheet.setStyleAttributePreprocessor;

describe(setStyleAttributePreprocessor, () => {
  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not show warning when set preprocessor first time', () => {
    const spyConsole = jest.spyOn(global.console, 'warn');
    setStyleAttributePreprocessor(
      'fontFamily',
      (fontFamily: string) => fontFamily,
    );
    expect(spyConsole).not.toHaveBeenCalled();
  });

  it('should show warning when overwrite the preprocessor', () => {
    const spyConsole = jest.spyOn(global.console, 'warn');
    setStyleAttributePreprocessor(
      'fontFamily',
      (fontFamily: string) => fontFamily,
    );
    setStyleAttributePreprocessor(
      'fontFamily',
      (fontFamily: string) => `Scoped-${fontFamily}`,
    );
    expect(spyConsole).toHaveBeenCalledWith(
      'Overwriting fontFamily style attribute preprocessor',
    );
  });
});
