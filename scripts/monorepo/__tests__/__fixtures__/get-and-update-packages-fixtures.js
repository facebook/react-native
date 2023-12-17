/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react-native
 */

const mockPackages = [
  {
    packageManifest: {
      name: '@react-native/packageA',
      version: 'local-version',
      dependencies: {},
      devDependencies: {},
    },
    packageAbsolutePath: '/some/place/packageA',
    packageRelativePathFromRoot: './place/packageA',
  },
  {
    packageManifest: {
      name: '@react-native/not_published',
      version: 'local-version',
      dependencies: {'@react-native/packageA': 'local-version'},
    },
    packageAbsolutePath: '/some/place/not_published',
    packageRelativePathFromRoot: './place/not_published',
  },
  {
    packageManifest: {
      name: '@react-native/packageB',
      version: 'local-version',
      dependencies: {'@react-native/packageA': 'local-version'},
    },
    packageAbsolutePath: '/some/place/packageB',
    packageRelativePathFromRoot: './place/packageB',
  },
  {
    packageManifest: {
      name: '@react-native/packageC',
      version: 'local-version',
      devDependencies: {'@react-native/packageE': 'local-version'},
    },
    packageAbsolutePath: '/some/place/packageC',
    packageRelativePathFromRoot: './place/packageC',
  },
  {
    packageManifest: {
      name: '@react-native/packageD',
      version: 'local-version',
      dependencies: {
        '@react-native/packageA': 'local-version',
        '@react-native/packageC': 'local-version',
      },
    },
    packageAbsolutePath: '/some/place/packageD',
    packageRelativePathFromRoot: './place/packageD',
  },
  {
    packageManifest: {name: '@react-native/packageE', version: 'local-version'},
    packageAbsolutePath: '/some/place/packageE',
    packageRelativePathFromRoot: './place/packageE',
  },
  {
    packageManifest: {
      name: '@react-native/packageF',
      version: 'local-version',
      dependencies: {
        '@react-native/packageB': 'local-version',
      },
      devDependencies: {
        '@react-native/packageD': 'local-version',
      },
    },
    packageAbsolutePath: '/some/place/packageF',
    packageRelativePathFromRoot: './place/packageF',
  },
  {
    packageManifest: {
      name: '@react-native/packageP',
      version: 'local-version',
      private: true,
      dependencies: {},
      devDependencies: {},
    },
    packageAbsolutePath: '/some/place/packageP',
    packageRelativePathFromRoot: './place/packageP',
  },
  {
    packageManifest: {
      name: 'react-native',
      version: 'local-version',
      private: true,
      dependencies: {
        '@react-native/packageA': 'local-version',
        '@react-native/packageB': 'local-version',
        '@react-native/packageC': 'local-version',
      },
      devDependencies: {
        '@react-native/packageD': 'local-version',
        '@react-native/packageE': 'local-version',
        '@react-native/packageF': 'local-version',
      },
    },
    packageAbsolutePath: '/some/place/react-native',
    packageRelativePathFromRoot: './place/react-native',
  },
];

function expectedPackageA(newVersion) {
  return {
    name: '@react-native/packageA',
    version: newVersion,
    dependencies: {},
    devDependencies: {},
  };
}

function expectedPackageB(newVersion) {
  return {
    name: '@react-native/packageB',
    version: newVersion,
    dependencies: {'@react-native/packageA': newVersion},
  };
}

function expectedPackageC(newVersion) {
  return {
    name: '@react-native/packageC',
    version: newVersion,
    devDependencies: {'@react-native/packageE': newVersion},
  };
}
function expectedPackageD(newVersion) {
  return {
    name: '@react-native/packageD',
    version: newVersion,
    dependencies: {
      '@react-native/packageA': newVersion,
      '@react-native/packageC': newVersion,
    },
  };
}
function expectedPackageE(newVersion) {
  return {name: '@react-native/packageE', version: newVersion};
}
function expectedPackageF(newVersion) {
  return {
    name: '@react-native/packageF',
    version: newVersion,
    dependencies: {
      '@react-native/packageB': newVersion,
    },
    devDependencies: {
      '@react-native/packageD': newVersion,
    },
  };
}

const expectedPackages = {
  '@react-native/packageA': expectedPackageA,
  '@react-native/packageB': expectedPackageB,
  '@react-native/packageC': expectedPackageC,
  '@react-native/packageD': expectedPackageD,
  '@react-native/packageE': expectedPackageE,
  '@react-native/packageF': expectedPackageF,
};

module.exports = {
  mockPackages,
  expectedPackages,
};
