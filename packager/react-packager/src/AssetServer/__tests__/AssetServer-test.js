'use strict';

jest
  .dontMock('../../DependencyResolver/lib/getPlatformExtension')
  .dontMock('../../DependencyResolver/lib/getAssetDataFromName')
  .dontMock('../');

jest
  .mock('crypto')
  .mock('fs');

const Promise = require('promise');

var AssetServer = require('../');
var crypto = require('crypto');
var fs = require('fs');

describe('AssetServer', () => {
  describe('assetServer.get', () => {
    pit('should work for the simple case', () => {
      const server = new AssetServer({
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
      ]).then(resp =>
        resp.forEach(data =>
          expect(data).toBe('b image')
        )
      );
    });

    pit('should work for the simple case with platform ext', () => {
      const server = new AssetServer({
        projectRoots: ['/root'],
        assetExts: ['png'],
      });

      fs.__setMockFilesystem({
        'root': {
          imgs: {
            'b.ios.png': 'b ios image',
            'b.android.png': 'b android image',
            'c.png': 'c general image',
            'c.android.png': 'c android image',
          }
        }
      });

      return Promise.all([
        server.get('imgs/b.png', 'ios').then(
          data => expect(data).toBe('b ios image')
        ),
        server.get('imgs/b.png', 'android').then(
          data => expect(data).toBe('b android image')
        ),
        server.get('imgs/c.png', 'android').then(
          data => expect(data).toBe('c android image')
        ),
        server.get('imgs/c.png', 'ios').then(
          data => expect(data).toBe('c general image')
        ),
        server.get('imgs/c.png').then(
          data => expect(data).toBe('c general image')
        ),
      ]);
    });


    pit('should work for the simple case with jpg', () => {
      const server = new AssetServer({
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
      ]).then(data =>
        expect(data).toEqual([
          'jpeg image',
          'png image',
        ])
      );
    });

    pit('should pick the bigger one', () => {
      const server = new AssetServer({
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

      return server.get('imgs/b@3x.png').then(data =>
        expect(data).toBe('b4 image')
      );
    });

    pit('should pick the bigger one with platform ext', () => {
      const server = new AssetServer({
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
            'b@1x.ios.png': 'b1 ios image',
            'b@2x.ios.png': 'b2 ios image',
            'b@4x.ios.png': 'b4 ios image',
            'b@4.5x.ios.png': 'b4.5 ios image',
          }
        }
      });

      return Promise.all([
        server.get('imgs/b@3x.png').then(data =>
          expect(data).toBe('b4 image')
        ),
        server.get('imgs/b@3x.png', 'ios').then(data =>
          expect(data).toBe('b4 ios image')
        ),
      ]);
    });

    pit('should support multiple project roots', () => {
      const server = new AssetServer({
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

      return server.get('newImages/imgs/b.png').then(data =>
        expect(data).toBe('b1 image')
      );
    });
  });

  describe('assetServer.getAssetData', () => {
    pit('should get assetData', () => {
      const hash = {
        update: jest.genMockFn(),
        digest: jest.genMockFn(),
      };

      hash.digest.mockImpl(() => 'wow such hash');
      crypto.createHash.mockImpl(() => hash);

      const server = new AssetServer({
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

      return server.getAssetData('imgs/b.png').then(data => {
        expect(hash.update.mock.calls.length).toBe(4);
        expect(data).toEqual({
          type: 'png',
          name: 'b',
          scales: [1, 2, 4, 4.5],
          files: [
            '/root/imgs/b@1x.png',
            '/root/imgs/b@2x.png',
            '/root/imgs/b@4x.png',
            '/root/imgs/b@4.5x.png',
          ],
          hash: 'wow such hash',
        });
      });
    });

    pit('should get assetData for non-png images', () => {
      const hash = {
        update: jest.genMockFn(),
        digest: jest.genMockFn(),
      };

      hash.digest.mockImpl(() => 'wow such hash');
      crypto.createHash.mockImpl(() => hash);

      const server = new AssetServer({
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

      return server.getAssetData('imgs/b.jpg').then(data => {
        expect(hash.update.mock.calls.length).toBe(4);
        expect(data).toEqual({
          type: 'jpg',
          name: 'b',
          scales: [1, 2, 4, 4.5],
          files: [
            '/root/imgs/b@1x.jpg',
            '/root/imgs/b@2x.jpg',
            '/root/imgs/b@4x.jpg',
            '/root/imgs/b@4.5x.jpg',
          ],
          hash: 'wow such hash',
        });
      });
    });
  });
});
