const chai = require('chai');
const expect = chai.expect;
const mock = require('mock-fs');
const fs = require('fs');
const path = require('path');
const makeImportPatch = require('../../../../src/android/patches/0.18/makeImportPatch');
const applyPatch = require('../../../../src/android/patches/applyPatch');

const projectConfig = {
  mainFilePath: 'MainActivity.java',
};

const packageImportPath = 'import some.example.project';

describe('makeImportPatch@0.18', () => {
  before(() => mock({
    'MainActivity.java': fs.readFileSync(
      path.join(__dirname, '../../../fixtures/android/0.18/MainActivity.java')
    ),
  }));

  it('MainActivity contains a correct 0.18 import patch', () => {
    const importPatch = makeImportPatch(packageImportPath);

    applyPatch('MainActivity.java', importPatch);
    expect(fs.readFileSync('MainActivity.java', 'utf8'))
      .to.have.string(importPatch.patch);
  });

  after(mock.restore);
});
