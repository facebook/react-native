/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

jest.mock('fs');

const fs = require('fs');
const findSymlinkedModules = require('../findSymlinkedModules');

describe('findSymlinksForProjectRoot', () => {
  it('correctly finds normal module symlinks', () => {
    fs.__setMockFilesystem({
      root: {
        projectA: {
          'package.json': JSON.stringify({
            name: 'projectA',
            main: 'main.js',
          }),
          node_modules: {
            depFoo: {
              'package.json': JSON.stringify({
                name: 'depFoo',
                main: 'main.js',
              }),
            },
            projectB: {
              SYMLINK: '/root/projectB',
            },
          },
        },
        projectB: {
          'package.json': JSON.stringify({
            name: 'projectB',
            main: 'main.js',
          }),
          node_modules: {
            depBar: {
              'package.json': JSON.stringify({
                name: 'depBar',
                main: 'main.js',
              }),
            },
          },
        },
      },
    });

    const symlinkedModules = findSymlinkedModules('/root/projectA', []);
    expect(symlinkedModules).toEqual(['/root/projectB']);
  });

  it('correctly finds scoped module symlinks', () => {
    fs.__setMockFilesystem({
      root: {
        projectA: {
          'package.json': JSON.stringify({
            name: 'projectA',
            main: 'main.js',
          }),
          node_modules: {
            depFoo: {
              'package.json': JSON.stringify({
                name: 'depFoo',
                main: 'main.js',
              }),
            },
            '@scoped': {
              projectC: {
                SYMLINK: '/root/@scoped/projectC',
              },
            },
            projectB: {
              SYMLINK: '/root/projectB',
            },
          },
        },
        projectB: {
          'package.json': JSON.stringify({
            name: 'projectB',
            main: 'main.js',
          }),
          node_modules: {
            depBar: {
              'package.json': JSON.stringify({
                name: 'depBar',
                main: 'main.js',
              }),
            },
          },
        },
        '@scoped': {
          projectC: {
            'package.json': JSON.stringify({
              name: '@scoped/projectC',
              main: 'main.js',
            }),
          },
        },
      },
    });

    const symlinkedModules = findSymlinkedModules('/root/projectA', []);
    expect(symlinkedModules).toEqual([
      '/root/@scoped/projectC',
      '/root/projectB',
    ]);
  });

  it('correctly finds module symlinks within other module symlinks', () => {
    fs.__setMockFilesystem({
      root: {
        projectA: {
          'package.json': JSON.stringify({
            name: 'projectA',
            main: 'main.js',
          }),
          node_modules: {
            depFoo: {
              'package.json': JSON.stringify({
                name: 'depFoo',
                main: 'main.js',
              }),
            },
            '@scoped': {
              projectC: {
                SYMLINK: '/root/@scoped/projectC',
              },
            },
            projectB: {
              SYMLINK: '/root/projectB',
            },
          },
        },
        projectB: {
          'package.json': JSON.stringify({
            name: 'projectB',
            main: 'main.js',
          }),
          node_modules: {
            depBar: {
              'package.json': JSON.stringify({
                name: 'depBar',
                main: 'main.js',
              }),
            },
            projectD: {
              SYMLINK: '/root/projectD',
            },
          },
        },
        '@scoped': {
          projectC: {
            'package.json': JSON.stringify({
              name: '@scoped/projectC',
              main: 'main.js',
            }),
          },
        },
        projectD: {
          'package.json': JSON.stringify({
            name: 'projectD',
            main: 'main.js',
          }),
        },
      },
    });

    const symlinkedModules = findSymlinkedModules('/root/projectA', []);
    expect(symlinkedModules).toEqual([
      '/root/@scoped/projectC',
      '/root/projectB',
      '/root/projectD',
    ]);
  });

  it('correctly handles duplicate symlink paths', () => {
    // projectA ->
    //          -> projectC
    //          -> projectB -> projectC
    // Final list should only contain projectC once
    fs.__setMockFilesystem({
      root: {
        projectA: {
          'package.json': JSON.stringify({
            name: 'projectA',
            main: 'main.js',
          }),
          node_modules: {
            depFoo: {
              'package.json': JSON.stringify({
                name: 'depFoo',
                main: 'main.js',
              }),
            },
            '@scoped': {
              projectC: {
                SYMLINK: '/root/@scoped/projectC',
              },
            },
            projectB: {
              SYMLINK: '/root/projectB',
            },
          },
        },
        projectB: {
          'package.json': JSON.stringify({
            name: 'projectB',
            main: 'main.js',
          }),
          node_modules: {
            depBar: {
              'package.json': JSON.stringify({
                name: 'depBar',
                main: 'main.js',
              }),
            },
            '@scoped': {
              projectC: {
                SYMLINK: '/root/@scoped/projectC',
              },
            },
          },
        },
        '@scoped': {
          projectC: {
            'package.json': JSON.stringify({
              name: '@scoped/projectC',
              main: 'main.js',
            }),
          },
        },
      },
    });

    const symlinkedModules = findSymlinkedModules('/root/projectA', []);
    expect(symlinkedModules).toEqual([
      '/root/@scoped/projectC',
      '/root/projectB',
    ]);
  });

  it('correctly handles symlink recursion', () => {
    // projectA ->
    //          -> projectC -> projectD -> projectA
    //          -> projectB -> projectC -> projectA
    //          -> projectD -> projectC -> projectA
    // Should not infinite loop, should not contain projectA
    fs.__setMockFilesystem({
      root: {
        projectA: {
          'package.json': JSON.stringify({
            name: 'projectA',
            main: 'main.js',
          }),
          node_modules: {
            depFoo: {
              'package.json': JSON.stringify({
                name: 'depFoo',
                main: 'main.js',
              }),
            },
            '@scoped': {
              projectC: {
                SYMLINK: '/root/@scoped/projectC',
              },
            },
            projectB: {
              SYMLINK: '/root/projectB',
            },
          },
        },
        projectB: {
          'package.json': JSON.stringify({
            name: 'projectB',
            main: 'main.js',
          }),
          node_modules: {
            depBar: {
              'package.json': JSON.stringify({
                name: 'depBar',
                main: 'main.js',
              }),
            },
            projectD: {
              SYMLINK: '/root/projectD',
            },
            '@scoped': {
              projectC: {
                SYMLINK: '/root/@scoped/projectC',
              },
            },
          },
        },
        '@scoped': {
          projectC: {
            'package.json': JSON.stringify({
              name: '@scoped/projectC',
              main: 'main.js',
            }),
            node_modules: {
              projectA: {
                SYMLINK: '/root/projectA',
              },
              projectD: {
                SYMLINK: '/root/projectD',
              },
              projectE: {
                SYMLINK: '/root/projectE',
              },
            },
          },
        },
        projectD: {
          'package.json': JSON.stringify({
            name: 'projectD',
            main: 'main.js',
          }),
          node_modules: {
            '@scoped': {
              projectC: {
                SYMLINK: '/root/@scoped/projectC',
              },
            },
            projectE: {
              SYMLINK: '/root/projectE',
            },
          },
        },
        projectE: {
          'package.json': JSON.stringify({
            name: 'projectD',
            main: 'main.js',
          }),
        },
      },
    });

    const symlinkedModules = findSymlinkedModules('/root/projectA');
    expect(symlinkedModules).toEqual([
      '/root/@scoped/projectC',
      '/root/projectB',
      '/root/projectD',
      '/root/projectE',
    ]);
  });
});
