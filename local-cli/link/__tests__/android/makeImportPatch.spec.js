'use strict';

jest.autoMockOff();

const makeImportPatch = require('../../android/patches/makeImportPatch');

const packageImportPath = 'import some.example.project';

describe('makeImportPatch', () => {
  it('should build a patch', () => {
    expect(Object.prototype.toString(makeImportPatch(packageImportPath)))
      .toBe('[object Object]');
  });

  it('MainActivity contains a correct import patch', () => {
    const {patch} = makeImportPatch(packageImportPath);

    expect(patch).toBe('\n' + packageImportPath);
  });
});
