const chai = require('chai');
const expect = chai.expect;
const xcode = require('xcode');
const getProducts = require('../../src/ios/getProducts');

const project = xcode.project('test/fixtures/linearGradient.pbxproj');

describe('ios::getProducts', () => {

  beforeEach(() => {
    project.parseSync();
  });

  it('should return an array of static libraries project exports', () => {
    const products = getProducts(project);
    expect(products.length).to.equals(1);
    expect(products).to.contains('libBVLinearGradient.a');
  });

});
