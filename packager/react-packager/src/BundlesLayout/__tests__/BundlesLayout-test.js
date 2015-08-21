/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .dontMock('../index');

const Promise = require('promise');

describe('BundlesLayout', () => {
  var BundlesLayout;
  var DependencyResolver;

  beforeEach(() => {
    BundlesLayout = require('../index');
    DependencyResolver = require('../../DependencyResolver');
  });

  describe('generate', () => {
    function newBundlesLayout() {
      return new BundlesLayout({
        dependencyResolver: new DependencyResolver(),
      });
    }

    function isPolyfill() {
      return false;
    }

    function dep(path) {
      return {
        path: path,
        isPolyfill: isPolyfill,
      };
    }

    pit('should bundle sync dependencies', () => {
      DependencyResolver.prototype.getDependencies.mockImpl((path) => {
        switch (path) {
          case '/root/index.js':
            return Promise.resolve({
              dependencies: [dep('/root/index.js'), dep('/root/a.js')],
              asyncDependencies: [],
            });
          case '/root/a.js':
            return Promise.resolve({
              dependencies: [dep('/root/a.js')],
              asyncDependencies: [],
            });
          default:
            throw 'Undefined path: ' + path;
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(bundles).toEqual({
          id: 'bundle.0',
          modules: ['/root/index.js', '/root/a.js'],
          children: [],
        })
      );
    });

    pit('should separate async dependencies into different bundle', () => {
      DependencyResolver.prototype.getDependencies.mockImpl((path) => {
        switch (path) {
          case '/root/index.js':
            return Promise.resolve({
              dependencies: [dep('/root/index.js')],
              asyncDependencies: [['/root/a.js']],
            });
          case '/root/a.js':
            return Promise.resolve({
              dependencies: [dep('/root/a.js')],
              asyncDependencies: [],
            });
          default:
            throw 'Undefined path: ' + path;
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(bundles).toEqual({
          id: 'bundle.0',
          modules: ['/root/index.js'],
          children: [{
            id:'bundle.0.1',
            modules: ['/root/a.js'],
            children: [],
          }],
        })
      );
    });

    pit('separate async dependencies of async dependencies', () => {
      DependencyResolver.prototype.getDependencies.mockImpl((path) => {
        switch (path) {
          case '/root/index.js':
            return Promise.resolve({
              dependencies: [dep('/root/index.js')],
              asyncDependencies: [['/root/a.js']],
            });
          case '/root/a.js':
            return Promise.resolve({
              dependencies: [dep('/root/a.js')],
              asyncDependencies: [['/root/b.js']],
            });
          case '/root/b.js':
            return Promise.resolve({
              dependencies: [dep('/root/b.js')],
              asyncDependencies: [],
            });
          default:
            throw 'Undefined path: ' + path;
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(bundles).toEqual({
          id: 'bundle.0',
          modules: ['/root/index.js'],
          children: [{
            id: 'bundle.0.1',
            modules: ['/root/a.js'],
              children: [{
                id: 'bundle.0.1.2',
                modules: ['/root/b.js'],
                children: [],
              }],
          }],
        })
      );
    });

    pit('separate bundle sync dependencies of async ones on same bundle', () => {
      DependencyResolver.prototype.getDependencies.mockImpl((path) => {
        switch (path) {
          case '/root/index.js':
            return Promise.resolve({
              dependencies: [dep('/root/index.js')],
              asyncDependencies: [['/root/a.js']],
            });
          case '/root/a.js':
            return Promise.resolve({
              dependencies: [dep('/root/a.js'), dep('/root/b.js')],
              asyncDependencies: [],
            });
          case '/root/b.js':
            return Promise.resolve({
              dependencies: [dep('/root/b.js')],
              asyncDependencies: [],
            });
          default:
            throw 'Undefined path: ' + path;
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(bundles).toEqual({
          id: 'bundle.0',
          modules: ['/root/index.js'],
          children: [{
            id: 'bundle.0.1',
            modules: ['/root/a.js', '/root/b.js'],
            children: [],
          }],
        })
      );
    });

    pit('separate cache in which bundle is each dependency', () => {
      DependencyResolver.prototype.getDependencies.mockImpl((path) => {
        switch (path) {
          case '/root/index.js':
            return Promise.resolve({
              dependencies: [dep('/root/index.js'), dep('/root/a.js')],
              asyncDependencies: [],
            });
          case '/root/a.js':
            return Promise.resolve({
              dependencies: [dep('/root/a.js')],
              asyncDependencies: [['/root/b.js']],
            });
          case '/root/b.js':
            return Promise.resolve({
              dependencies: [dep('/root/b.js')],
              asyncDependencies: [],
            });
          default:
            throw 'Undefined path: ' + path;
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(
        bundles => expect(bundles).toEqual({
          id: 'bundle.0',
          modules: ['/root/index.js', '/root/a.js'],
          children: [{
            id: 'bundle.0.1',
            modules: ['/root/b.js'],
            children: [],
          }],
        })
      );
    });

    pit('separate cache in which bundle is each dependency', () => {
      DependencyResolver.prototype.getDependencies.mockImpl((path) => {
        switch (path) {
          case '/root/index.js':
            return Promise.resolve({
              dependencies: [dep('/root/index.js'), dep('/root/a.js')],
              asyncDependencies: [['/root/b.js'], ['/root/c.js']],
            });
          case '/root/a.js':
            return Promise.resolve({
              dependencies: [dep('/root/a.js')],
              asyncDependencies: [],
            });
          case '/root/b.js':
            return Promise.resolve({
              dependencies: [dep('/root/b.js')],
              asyncDependencies: [['/root/d.js']],
            });
          case '/root/c.js':
            return Promise.resolve({
              dependencies: [dep('/root/c.js')],
              asyncDependencies: [],
            });
          case '/root/d.js':
            return Promise.resolve({
              dependencies: [dep('/root/d.js')],
              asyncDependencies: [],
            });
          default:
            throw 'Undefined path: ' + path;
        }
      });

      var layout = newBundlesLayout();
      return layout.generateLayout(['/root/index.js']).then(() => {
        expect(layout.getBundleIDForModule('/root/index.js')).toBe('bundle.0');
        expect(layout.getBundleIDForModule('/root/a.js')).toBe('bundle.0');
        expect(layout.getBundleIDForModule('/root/b.js')).toBe('bundle.0.1');
        expect(layout.getBundleIDForModule('/root/c.js')).toBe('bundle.0.2');
        expect(layout.getBundleIDForModule('/root/d.js')).toBe('bundle.0.1.3');
      });
    });
  });
});
