'use strict';

const xcode = require('xcode');
const getProducts = require('../../ios/getProducts');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::getProducts', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return an array of static libraries project exports', () => {
    const products = getProducts(project);
    expect(products.length).toBe(1);
    expect(products).toContain('libRCTActionSheet.a');
  });
});
