'use strict';

var Promise = require('promise');
var Bundle = require('../../packager/react-packager/src/Bundler/Bundle');

jest.mock('fs');
jest.dontMock('../bundle');
jest.dontMock('path');

jest.setMock('../../packager/react-packager', {
  buildPackageFromUrl: jest.genMockFn().mockImplementation(function() {
    return new Promise(function(resolve, reject) {
      resolve(new Bundle());
    });
  })
});

var bundle = require('../bundle.js');

describe('bundle', function() {

  describe('with help argument', function() {
    var originalLog;
    var originalExit;

    beforeEach(function() {
      originalLog = console.log;
      originalExit = process.exit;
    });

    afterEach(function() {
      console.log = originalLog;
      process.exit = originalExit;
    });

    it('shows usage and options', function() {
      console.log = jest.genMockFn();
      process.exit = jest.genMockFn();
      bundle.init(['--help']);
      expect(console.log).toBeCalled();
      expect(console.log.mock.calls[0][0]).toContain('Usage');
      expect(console.log.mock.calls[0][0]).toContain('Options');
    });
  });

  describe('with deprecated arguments', function() {
    var Packager;
    var originalLog;
    var originalExit;

    beforeEach(function() {
      originalLog = console.log;
      originalExit = process.exit;
      Packager = require('../../packager/react-packager');
    });

    afterEach(function() {
      console.log = originalLog;
      process.exit = originalExit;
      Packager.buildPackageFromUrl.mockClear();
    });

    it('shows an error message when --root is used', function() {
      console.log = jest.genMockFn();
      process.exit = jest.genMockFn();
      bundle.init(['--root']);
      expect(console.log).toBeCalled();
      expect(console.log.mock.calls[0][0]).toContain('deprecated argument. Use --roots');
      expect(console.log.mock.calls[1][0]).toContain('Usage');
    });

    it('shows an error message when --url is used', function() {
      console.log = jest.genMockFn();
      process.exit = jest.genMockFn();
      bundle.init(['--url']);
      expect(console.log).toBeCalled();
      expect(console.log.mock.calls[0][0]).toContain('deprecated argument. Use --appModule');
      expect(console.log.mock.calls[1][0]).toContain('Usage');
    });
  });

  describe('with no additional arguments', function() {
    var Packager;

    beforeEach(function() {
      Packager = require('../../packager/react-packager');
      bundle.init([]);
    });

    afterEach(function() {
      Packager.buildPackageFromUrl.mockClear();
    });

    it('includes at least one default root', function() {
      expect(Packager.buildPackageFromUrl).toBeCalled();
      expect(Packager.buildPackageFromUrl.mock.calls[0][0].projectRoots.length).toBeGreaterThan(0);
    });

    it('includes at least one default asset root', function() {
      expect(Packager.buildPackageFromUrl).toBeCalled();
      expect(Packager.buildPackageFromUrl.mock.calls[0][0].assetRoots.length).toBeGreaterThan(0);
    });

    it('dev query param on url is false', function() {
      expect(Packager.buildPackageFromUrl).toBeCalled();
      expect(Packager.buildPackageFromUrl.mock.calls[0][1]).toContain('dev=false');
    });

    it('platform query param on url is ios', function() {
      expect(Packager.buildPackageFromUrl).toBeCalled();
      expect(Packager.buildPackageFromUrl.mock.calls[0][1]).toContain('platform=ios');
    });
  });

  describe('with arguments', function() {
    var Packager;

    beforeEach(function() {
      Packager = require('../../packager/react-packager');
    });

    afterEach(function() {
      Packager.buildPackageFromUrl.mockClear();
    });

    it('passes additional roots to packager', function() {
      bundle.init(['--roots', '/other_modules,/more_modules']);
      expect(Packager.buildPackageFromUrl).toBeCalled();
      expect(Packager.buildPackageFromUrl.mock.calls[0][0].projectRoots.indexOf('/other_modules')).toBeGreaterThan(-1);
    });

    it('passes additional asset roots to packager', function() {
      bundle.init(['--assetRoots', '/other_modules,/more_modules']);
      expect(Packager.buildPackageFromUrl).toBeCalled();
      expect(Packager.buildPackageFromUrl.mock.calls[0][0].assetRoots.indexOf('/other_modules')).toBeGreaterThan(-1);
    });

    it('passes bundle url based off appModule to packager', function() {
      bundle.init(['--appModule', 'MyApp.js']);
      expect(Packager.buildPackageFromUrl).toBeCalled();
      expect(Packager.buildPackageFromUrl.mock.calls[0][1]).toContain('/MyApp.bundle');
    });

    it('sets dev query param on url when dev argument set', function() {
      bundle.init(['--dev', 'MyApp.js']);
      expect(Packager.buildPackageFromUrl).toBeCalled();
      expect(Packager.buildPackageFromUrl.mock.calls[0][1]).toContain('dev=true');
    });

    it('sets platform query param on url when platform argument set', function() {
      bundle.init(['--platform', 'android']);
      expect(Packager.buildPackageFromUrl).toBeCalled();
      expect(Packager.buildPackageFromUrl.mock.calls[0][1]).toContain('platform=android');
    });
  });

});
