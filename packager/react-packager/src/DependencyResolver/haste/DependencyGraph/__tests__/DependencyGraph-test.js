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
  .dontMock('../index')
  .dontMock('q')
  .dontMock('path')
  .dontMock('absolute-path')
  .dontMock('../docblock')
  .setMock('../../../ModuleDescriptor', function(data) {return data;});

describe('DependencyGraph', function() {
  var DependencyGraph;
  var fileWatcher;
  var fs;

  beforeEach(function() {
    fs = require('fs');
    DependencyGraph = require('../index');

    fileWatcher = {
      on: function() {
        return this;
      }
    };
  });

  describe('getOrderedDependencies', function() {
    pit('should get dependencies', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("a")'
          ].join('\n'),
          'a.js': [
            '/**',
            ' * @providesModule a',
            ' */',
          ].join('\n'),
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            {id: 'index', altId: '/root/index.js', path: '/root/index.js', dependencies: ['a']},
            {id: 'a', altId: '/root/a.js', path: '/root/a.js', dependencies: []},
          ]);
      });
    });

    pit('should get dependencies', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("image!a")'
          ].join('\n'),
          'imgs': {
            'a.png': ''
          },
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher,
        assetRoots: ['/root/imgs']
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            {id: 'index', altId: '/root/index.js', path: '/root/index.js', dependencies: ['image!a']},
            {  id: 'image!a',
               path: '/root/imgs/a.png',
               dependencies: [],
               isAsset: true
            },
          ]);
      });
    });

    pit('should get recursive dependencies', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("a")',
          ].join('\n'),
          'a.js': [
            '/**',
            ' * @providesModule a',
            ' */',
            'require("index")',
          ].join('\n'),
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            {id: 'index', altId: '/root/index.js', path: '/root/index.js', dependencies: ['a']},
            {id: 'a', altId: '/root/a.js', path: '/root/a.js', dependencies: ['index']},
          ]);
      });
    });

    pit('should work with packages', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js'
            }),
            'main.js': 'lol'
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            {id: 'index', altId: '/root/index.js', path: '/root/index.js', dependencies: ['aPackage']},
            { id: 'aPackage/main',
              path: '/root/aPackage/main.js',
              dependencies: []
            },
          ]);
      });
    });

    pit('should default main package to index.js', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require("aPackage")',
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
            }),
            'index.js': 'lol',
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            {id: '/root/index.js', path: '/root/index.js', dependencies: ['aPackage']},
            { id: 'aPackage/index',
              path: '/root/aPackage/index.js',
              dependencies: []
            },
          ]);
      });
    });

    pit('should have altId for a package with providesModule', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require("aPackage")',
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
            }),
            'index.js': [
              '/**',
              ' * @providesModule EpicModule',
              ' */',
            ].join('\n'),
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            {id: '/root/index.js', path: '/root/index.js', dependencies: ['aPackage']},
            { id: 'EpicModule',
              altId: 'aPackage/index',
              path: '/root/aPackage/index.js',
              dependencies: []
            },
          ]);
      });
    });

    pit('should default use index.js if main is a dir', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require("aPackage")',
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'lib',
            }),
            lib: {
              'index.js': 'lol',
            },
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            {id: '/root/index.js', path: '/root/index.js', dependencies: ['aPackage']},
            { id: 'aPackage/lib/index',
              path: '/root/aPackage/lib/index.js',
              dependencies: []
            },
          ]);
      });
    });

    pit('should resolve require to index if it is a dir', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'package.json': JSON.stringify({
            name: 'test',
          }),
          'index.js': 'require("./lib/")',
          lib: {
            'index.js': 'lol',
          },
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            {id: 'test/index', path: '/root/index.js', dependencies: ['./lib/']},
            { id: 'test/lib/index',
              path: '/root/lib/index.js',
              dependencies: []
            },
          ]);
      });
    });

    pit('should ignore malformed packages', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': 'lol',
            'main.js': 'lol'
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            {id: 'index', altId: '/root/index.js', path: '/root/index.js', dependencies: ['aPackage']},
          ]);
      });
    });

    pit('can have multiple modules with the same name', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("b")',
          ].join('\n'),
          'b.js': [
            '/**',
            ' * @providesModule b',
            ' */',
          ].join('\n'),
          'c.js': [
            '/**',
            ' * @providesModule c',
            ' */',
          ].join('\n'),
          'somedir': {
            'somefile.js': [
              '/**',
              ' * @providesModule index',
              ' */',
              'require("c")',
            ].join('\n')
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/somedir/somefile.js'))
          .toEqual([
            { id: 'index',
              altId: '/root/somedir/somefile.js',
              path: '/root/somedir/somefile.js',
              dependencies: ['c']
            },
            { id: 'c',
              altId: '/root/c.js',
              path: '/root/c.js',
              dependencies: []
            },
          ]);
      });
    });

    pit('providesModule wins when conflict with package', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'b.js': [
            '/**',
            ' * @providesModule aPackage',
            ' */',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js'
            }),
            'main.js': 'lol'
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            { id: 'index', altId: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['aPackage']
            },
            { id: 'aPackage',
              altId: '/root/b.js',
              path: '/root/b.js',
              dependencies: []
            },
          ]);
      });
    });

    pit('should be forgiving with missing requires', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("lolomg")',
          ].join('\n')
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            { id: 'index', altId: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['lolomg']
            }
          ]);
      });
    });

    pit('should work with packages with subdirs', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage/subdir/lolynot")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js'
            }),
            'main.js': 'lol',
            'subdir': {
              'lolynot.js': 'lolynot'
            }
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            { id: 'index', altId: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['aPackage/subdir/lolynot']
            },
            { id: 'aPackage/subdir/lolynot',
              path: '/root/aPackage/subdir/lolynot.js',
              dependencies: []
            },
          ]);
      });
    });

    pit('should work with packages with symlinked subdirs', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'symlinkedPackage': {
          'package.json': JSON.stringify({
            name: 'aPackage',
            main: 'main.js'
          }),
          'main.js': 'lol',
          'subdir': {
            'lolynot.js': 'lolynot'
          }
        },
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage/subdir/lolynot")',
          ].join('\n'),
          'aPackage': { SYMLINK: '/symlinkedPackage' },
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            { id: 'index', altId: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['aPackage/subdir/lolynot']
            },
            { id: 'aPackage/subdir/lolynot',
              path: '/symlinkedPackage/subdir/lolynot.js',
              dependencies: []
            },
          ]);
      });
    });

    pit('should work with relative modules in packages', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js'
            }),
            'main.js': 'require("./subdir/lolynot")',
            'subdir': {
              'lolynot.js': 'require("../other")'
            },
            'other.js': 'some code'
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            { id: 'index', altId: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['aPackage']
            },
            { id: 'aPackage/main',
              path: '/root/aPackage/main.js',
              dependencies: ['./subdir/lolynot']
            },
            { id: 'aPackage/subdir/lolynot',
              path: '/root/aPackage/subdir/lolynot.js',
              dependencies: ['../other']
            },
            { id: 'aPackage/other',
              path: '/root/aPackage/other.js',
              dependencies: []
            },
          ]);
      });
    });
  });

  describe('file watch updating', function() {
    var triggerFileChange;

    beforeEach(function() {
      fileWatcher = {
        on: function(eventType, callback) {
          if (eventType !== 'all') {
            throw new Error('Can only handle "all" event in watcher.');
          }
          triggerFileChange = callback;
          return this;
        }
      };
    });

    pit('updates module dependencies', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")'
          ].join('\n'),
          'foo': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")'
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js'
            }),
            'main.js': 'main',
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        filesystem.root['index.js'] =
          filesystem.root['index.js'].replace('require("foo")', '');
        triggerFileChange('change', 'index.js', root);
        return dgraph.load().then(function() {
          expect(dgraph.getOrderedDependencies('/root/index.js'))
            .toEqual([
              { id: 'index', altId: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['aPackage']
            },
            { id: 'aPackage/main',
              path: '/root/aPackage/main.js',
              dependencies: []
            },
          ]);
        });
      });
    });

    pit('updates module dependencies on file change', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")'
          ].join('\n'),
          'foo.js': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")'
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js'
            }),
            'main.js': 'main',
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        filesystem.root['index.js'] =
          filesystem.root['index.js'].replace('require("foo")', '');
        triggerFileChange('change', 'index.js', root);
        return dgraph.load().then(function() {
          expect(dgraph.getOrderedDependencies('/root/index.js'))
            .toEqual([
              { id: 'index', altId: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['aPackage']
            },
            { id: 'aPackage/main',
              path: '/root/aPackage/main.js',
              dependencies: []
            },
          ]);
        });
      });
    });

    pit('updates module dependencies on file delete', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")'
          ].join('\n'),
          'foo.js': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")'
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js'
            }),
            'main.js': 'main',
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        delete filesystem.root.foo;
        triggerFileChange('delete', 'foo.js', root);
        return dgraph.load().then(function() {
          expect(dgraph.getOrderedDependencies('/root/index.js'))
            .toEqual([
              { id: 'index', altId: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['aPackage', 'foo']
            },
            { id: 'aPackage/main',
              path: '/root/aPackage/main.js',
              dependencies: []
            },
          ]);
        });
      });
    });

    pit('updates module dependencies on file add', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")'
          ].join('\n'),
          'foo.js': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")'
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js'
            }),
            'main.js': 'main',
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        filesystem.root['bar.js'] = [
          '/**',
          ' * @providesModule bar',
          ' */',
          'require("foo")'
        ].join('\n');
        triggerFileChange('add', 'bar.js', root);

        filesystem.root.aPackage['main.js'] = 'require("bar")';
        triggerFileChange('change', 'aPackage/main.js', root);

        return dgraph.load().then(function() {
          expect(dgraph.getOrderedDependencies('/root/index.js'))
            .toEqual([
              { id: 'index', altId: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['aPackage', 'foo']
            },
            { id: 'aPackage/main',
              path: '/root/aPackage/main.js',
              dependencies: ['bar']
            },
            { id: 'bar',
              altId: '/root/bar.js',
              path: '/root/bar.js',
              dependencies: ['foo']
            },
            { id: 'foo',
              altId: '/root/foo.js',
              path: '/root/foo.js',
              dependencies: ['aPackage']
            },
          ]);
        });
      });
    });

    pit('updates module dependencies on asset add', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("image!foo")'
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        assetRoots: [root],
        assetExts: ['png'],
        fileWatcher: fileWatcher
      });

      return dgraph.load().then(function() {
        expect(dgraph.getOrderedDependencies('/root/index.js'))
          .toEqual([
            { id: 'index', altId: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['image!foo']
            }
          ]);

        filesystem.root['foo.png'] = '';
        triggerFileChange('add', 'foo.png', root);

        return dgraph.load().then(function() {
          expect(dgraph.getOrderedDependencies('/root/index.js'))
            .toEqual([
            { id: 'index', altId: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['image!foo']
            },
            { id: 'image!foo',
              path: '/root/foo.png',
              dependencies: [],
              isAsset: true,
            },
          ]);
        });
      });
    });

    pit('runs changes through ignore filter', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")'
          ].join('\n'),
          'foo.js': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")'
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js'
            }),
            'main.js': 'main',
          }
        }
      });

      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher,
        ignoreFilePath: function(filePath) {
          if (filePath === '/root/bar.js') {
            return true;
          }
          return false;
        }
      });
      return dgraph.load().then(function() {
        filesystem.root['bar.js'] = [
          '/**',
          ' * @providesModule bar',
          ' */',
          'require("foo")'
        ].join('\n');
        triggerFileChange('add', 'bar.js', root);

        filesystem.root.aPackage['main.js'] = 'require("bar")';
        triggerFileChange('change', 'aPackage/main.js', root);

        return dgraph.load().then(function() {
          expect(dgraph.getOrderedDependencies('/root/index.js'))
            .toEqual([
              { id: 'index', altId: '/root/index.js',
                path: '/root/index.js',
                dependencies: ['aPackage', 'foo']
              },
              { id: 'aPackage/main',
                path: '/root/aPackage/main.js',
                dependencies: ['bar']
              },
              { id: 'foo',
                altId: '/root/foo.js',
                path: '/root/foo.js',
                dependencies: ['aPackage']
              },
            ]);
        });
      });
    });

    pit('should ignore directory updates', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")'
          ].join('\n'),
          'foo.js': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")'
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js'
            }),
            'main.js': 'main',
          }
        }
      });
      var dgraph = new DependencyGraph({
        roots: [root],
        fileWatcher: fileWatcher
      });
      return dgraph.load().then(function() {
        triggerFileChange('change', 'aPackage', '/root', {
          isDirectory: function(){ return true; }
        });
        return dgraph.load().then(function() {
          expect(dgraph.getOrderedDependencies('/root/index.js'))
            .toEqual([
              { id: 'index', altId: '/root/index.js',
                path: '/root/index.js',
                dependencies: ['aPackage', 'foo']
              },
              { id: 'aPackage/main',
                path: '/root/aPackage/main.js',
                dependencies: []
              },
              { id: 'foo',
                altId: '/root/foo.js',
                path: '/root/foo.js',
                dependencies: ['aPackage']
              },
            ]);
        });
      });
    });
  });
});
