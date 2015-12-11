/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+jsinfra
 */

'use strict';

jest.autoMockOff();
jest.mock('../../../BundlesLayout');

const babel = require('babel-core');
const BundlesLayout = require('../../../BundlesLayout');

const testData = {
  isolated: {
    input:  'System.import("moduleA");',
    output: 'loadBundles(["bundle.0"]);'
  },
  single: {
    input:  'System.import("moduleA").then(function (bundleA) {});',
    output: 'loadBundles(["bundle.0"]).then(function (bundleA) {});'
  },
  multiple: {
    input: [
      'Promise.all([',
        'System.import("moduleA"), System.import("moduleB"),',
      ']).then(function (bundlesA, bundlesB) {});',
    ].join('\n'),
    output: [
      'Promise.all([',
        'loadBundles(["bundle.0"]), loadBundles(["bundle.1"])',
      ']).then(function (bundlesA, bundlesB) {});',
    ].join(''),
  },
};

describe('System.import', () => {
  let layout = new BundlesLayout();
  BundlesLayout.prototype.getBundleIDForModule.mockImpl(module => {
    switch (module) {
      case 'moduleA': return 'bundle.0';
      case 'moduleB': return 'bundle.1';
    }
  });

  function transform(source) {
    return babel.transform(source, {
      plugins: [require('../')],
      blacklist: ['strict'],
      extra: { bundlesLayout: layout },
    }).code;
  }

  function test(data) {
    // transform and remove new lines
    expect(transform(data.input).replace(/(\r\n|\n|\r)/gm,'')).toEqual(data.output);
  }

  it('should transform isolated `System.import`', () => {
    test(testData.isolated);
  });

  it('should transform single `System.import`', () => {
    test(testData.single);
  });

  it('should transform multiple `System.import`s', () => {
    test(testData.multiple);
  });
});
