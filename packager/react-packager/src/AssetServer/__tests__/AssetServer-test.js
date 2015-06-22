'use strict';

jest
  .dontMock('../../lib/getAssetDataFromName')
  .dontMock('../');

jest
  .mock('crypto')
  .mock('fs');

var Promise = require('promise');

describe('AssetServer', function() {
  var AssetServer;
  var crypto;
  var fs;

  beforeEach(function() {
    AssetServer = require('../');
    crypto = require('crypto');
    fs = require('fs');
  });

  describe('assetServer.get', function() {
    pit('should work for the simple case', function() {
      var server = new AssetServer({
        projectRoots: ['/root'],
        assetExts: ['png'],
      });

      fs.__setMockFilesystem({
        'root': {
          imgs: {
            'b.png': 'b image',
            'b@2x.png': 'b2 image',
          }
        }
      });

      return Promise.all([
        server.get('imgs/b.png'),
        server.get('imgs/b@1x.png'),
      ]).then(function(resp) {
        resp.forEach(function(data) {
          expect(data).toBe('b image');
        });
      });
    });

    pit('should work for the simple case with jpg', function() {
      var server = new AssetServer({
        projectRoots: ['/root'],
        assetExts: ['png', 'jpg'],
      });

      fs.__setMockFilesystem({
        'root': {
          imgs: {
            'b.png': 'png image',
            'b.jpg': 'jpeg image',
          }
        }
      });

      return Promise.all([
        server.get('imgs/b.jpg'),
        server.get('imgs/b.png'),
      ]).then(function(data) {
        expect(data).toEqual([
          'jpeg image',
          'png image',
        ]);
      });
    });

    pit('should pick the bigger one', function() {
      var server = new AssetServer({
        projectRoots: ['/root'],
        assetExts: ['png'],
      });

      fs.__setMockFilesystem({
        'root': {
          imgs: {
            'b@1x.png': 'b1 image',
            'b@2x.png': 'b2 image',
            'b@4x.png': 'b4 image',
            'b@4.5x.png': 'b4.5 image',
          }
        }
      });

      return server.get('imgs/b@3x.png').then(function(data) {
        expect(data).toBe('b4 image');
      });
    });

    pit('should support multiple project roots', function() {
      var server = new AssetServer({
        projectRoots: ['/root', '/root2'],
        assetExts: ['png'],
      });

      fs.__setMockFilesystem({
        'root': {
          imgs: {
            'b.png': 'b image',
          },
        },
        'root2': {
          'newImages': {
            'imgs': {
              'b@1x.png': 'b1 image',
            },
          },
        },
      });

      return server.get('newImages/imgs/b.png').then(function(data) {
        expect(data).toBe('b1 image');
      });
    });
  });

  describe('assetSerer.getAssetData', function() {
    pit('should get assetData', function() {
      var hash = {
        update: jest.genMockFn(),
        digest: jest.genMockFn(),
      };

      hash.digest.mockImpl(function() {
        return 'wow such hash';
      });
      crypto.createHash.mockImpl(function() {
        return hash;
      });

      var server = new AssetServer({
        projectRoots: ['/root'],
        assetExts: ['png'],
      });

      fs.__setMockFilesystem({
        'root': {
          imgs: {
            'b@1x.png': 'b1 image',
            'b@2x.png': 'b2 image',
            'b@4x.png': 'b4 image',
            'b@4.5x.png': 'b4.5 image',
          }
        }
      });

      return server.getAssetData('imgs/b.png').then(function(data) {
        expect(hash.update.mock.calls.length).toBe(4);
        expect(data).toEqual({
          type: 'png',
          name: 'b',
          scales: [1, 2, 4, 4.5],
          hash: 'wow such hash',
        });
      });
    });

    pit('should get assetData for non-png images', function() {
      var hash = {
        update: jest.genMockFn(),
        digest: jest.genMockFn(),
      };

      hash.digest.mockImpl(function() {
        return 'wow such hash';
      });
      crypto.createHash.mockImpl(function() {
        return hash;
      });

      var server = new AssetServer({
        projectRoots: ['/root'],
        assetExts: ['png', 'jpeg'],
      });

      fs.__setMockFilesystem({
        'root': {
          imgs: {
            'b@1x.jpg': 'b1 image',
            'b@2x.jpg': 'b2 image',
            'b@4x.jpg': 'b4 image',
            'b@4.5x.jpg': 'b4.5 image',
          }
        }
      });

      return server.getAssetData('imgs/b.jpg').then(function(data) {
        expect(hash.update.mock.calls.length).toBe(4);
        expect(data).toEqual({
          type: 'jpg',
          name: 'b',
          scales: [1, 2, 4, 4.5],
          hash: 'wow such hash',
        });
      });
    });
  });
});
