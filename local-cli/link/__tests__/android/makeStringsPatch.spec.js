'use strict';

const makeStringsPatch = require('../../android/patches/makeStringsPatch');

describe('makeStringsPatch', () => {
  it('should export a patch with <string> element', () => {
    const params = {
      keyA: 'valueA',
    };

    expect(makeStringsPatch(params, 'module').patch)
      .toContain('<string moduleConfig="true" name="module_keyA">valueA</string>');
  });

  it('should export an empty patch if no params given', () => {
    expect(makeStringsPatch({}, 'module').patch).toBe('');
  });
});
