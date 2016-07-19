const chai = require('chai');
const expect = chai.expect;
const mock = require('mock-fs');
const fs = require('fs');
const path = require('path');
const makePackagePatch = require('../../../../src/android/patches/0.18/makePackagePatch');
const applyPatch = require('../../../../src/android/patches/applyPatch');

const projectConfig = {
  mainFilePath: 'MainActivity.java',
};

const packageInstance = 'new SomeLibrary(${foo}, ${bar}, \'something\')';
const name = 'some-library';
const params = {
  foo: 'foo',
  bar: 'bar',
};

describe('makePackagePatch@0.18', () => {
  before(() => mock({
    'MainActivity.java': fs.readFileSync(
      path.join(__dirname, '../../../fixtures/android/0.18/MainActivity.java')
    ),
  }));

  it('MainActivity contains a correct 0.18 package patch', () => {
    const packagePatch = makePackagePatch(packageInstance, params, name);

    applyPatch('MainActivity.java', packagePatch);
    expect(fs.readFileSync('MainActivity.java', 'utf8'))
      .to.have.string(packagePatch.patch);
  });

  after(mock.restore);
});
