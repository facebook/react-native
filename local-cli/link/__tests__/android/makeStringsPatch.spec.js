'use strict';

jest.autoMockOff();

const makeStringsPatch = require('../../android/patches/makeStringsPatch');

describe('makeStringsPatch', () => {
  it('should export a patch with <string> element', () => {
    const params = {
      keyA: 'valueA',
    };

    const hasCorrectPatch = makeStringsPatch(params, 'module').patch
      .indexOf('<string moduleConfig="true" name="module_keyA">valueA</string>') >= 0;

    expect(hasCorrectPatch).toBe(true);
  });

  it('should export an empty patch if no params given', () => {
    expect(makeStringsPatch({}, 'module').patch).toBe('');
  });
});
