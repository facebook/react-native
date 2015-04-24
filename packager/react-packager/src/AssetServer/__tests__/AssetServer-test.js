'use strict';

jest
  .dontMock('path')
  .dontMock('../../lib/getAssetDataFromName')
  .dontMock('../');

var Promise = require('bluebird');

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
  });
});
