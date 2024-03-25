/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import {setStyleAttributePreprocessor} from '../StyleSheet';

describe(setStyleAttributePreprocessor, () => {
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    jest.resetModules();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
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
