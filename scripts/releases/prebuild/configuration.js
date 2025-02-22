/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

/*::
import type { Dependency, Platform } from './types';
*/

//TODO: Add support for mac,  Mac (catalyst), tvOS, xros and xrsimulator
const platforms /*: $ReadOnlyArray<Platform> */ = ['iOS', 'iOS Simulator'];

const dependencies /*: $ReadOnlyArray<Dependency> */ = [
  {
    name: 'glog',
    version: '0.3.5',
    url: new URL(
      'https://github.com/google/glog/archive/refs/tags/v0.3.5.tar.gz',
    ),
    prepareScript: './packages/react-native/scripts/ios-configure-glog.sh',
    files: {
      sources: [
        'src/*.h',
        'src/base/*.h',
        'src/glog/*.h',
        'src/demangle.cc',
        'src/logging.cc',
        'src/raw_logging.cc',
        'src/signalhandler.cc',
        'src/symbolize.cc',
        'src/utilities.cc',
        'src/vlog_is_on.cc',
      ],
      headers: ['src/*.h', 'src/glog/*.h', 'src/base/*.h'],
      resources: ['../third-party-podspecs/glog/PrivacyInfo.xcprivacy'],
      headerSkipFolderNames: 'src',
    },
    settings: {
      publicHeaderFiles: './src',
      headerSearchPaths: ['src'],
      compilerFlags: ['-Wno-shorten-64-to-32', '-Wno-everything'],
      defines: [
        {name: 'DEFINES_MODULE', value: 'YES'},
        {name: 'USE_HEADERMAP', value: 'NO'},
      ],
    },
  },
  {
    name: 'double-conversion',
    version: '1.1.6',
    url: new URL(
      'https://github.com/google/double-conversion/archive/refs/tags/v1.1.6.tar.gz',
    ),
    files: {
      sources: ['src/*.{h,cc}'],
      headers: ['src/*.h'],
      headerSkipFolderNames: 'src',
    },
    settings: {
      publicHeaderFiles: './src',
      headerSearchPaths: ['src'],
      compilerFlags: ['-Wno-everything'],
    },
  },
  {
    name: 'fmt',
    version: '11.0.2',
    url: new URL(
      'https://github.com/fmtlib/fmt/archive/refs/tags/11.0.2.tar.gz',
    ),
    files: {
      sources: ['src/format.cc', 'include/fmt/*.h'],
      headers: ['include/fmt/*.h'],
      headerSkipFolderNames: 'include',
    },
    settings: {
      publicHeaderFiles: './include',
      headerSearchPaths: ['include'],
      linkedLibraries: ['c++'],
      compilerFlags: ['-Wno-everything', '-std=c++11'],
    },
  },
  {
    name: 'boost',
    version: '1.84.0',
    prepareScript: 'touch dummy.cc',
    url: new URL(
      'https://github.com/react-native-community/boost-for-react-native/archive/refs/tags/v1.84.0.tar.gz',
    ),
    files: {
      sources: ['boost/**/*.hpp', 'dummy.cc'],
      headers: ['boost/**/*.hpp'],
      resources: ['../third-party-podspecs/boost/PrivacyInfo.xcprivacy'],
    },
    settings: {
      publicHeaderFiles: './boost',
      headerSearchPaths: ['boost'],
      compilerFlags: ['-Wno-everything'],
    },
  },
  {
    name: 'fast_float',
    version: '6.1.4',
    prepareScript: 'touch dummy.cc',
    url: new URL(
      'https://github.com/fastfloat/fast_float/archive/refs/tags/v6.1.4.tar.gz',
    ),
    files: {
      sources: ['./include/fast_float/*.h', 'dummy.cc'],
      headers: ['./include/fast_float/*.h'],
      headerSkipFolderNames: 'include',
    },
    settings: {
      publicHeaderFiles: './include',
      headerSearchPaths: ['include'],
      compilerFlags: ['-Wno-everything', '-std=c++11'],
      linkedLibraries: ['c++'],
    },
  },
  {
    name: 'socket-rocket',
    version: '0.7.1',
    url: new URL(
      'https://github.com/facebookincubator/SocketRocket/archive/refs/tags/0.7.1.tar.gz',
    ),
    files: {
      sources: ['SocketRocket/**/*.{h,m}'],
      headers: ['SocketRocket/*.h'],
    },
    settings: {
      publicHeaderFiles: './SocketRocket',
      headerSearchPaths: [
        './',
        'SocketRocket',
        'SocketRocket/Internal',
        'SocketRocket/Internal/Utilities',
        'SocketRocket/Internal/Delegate',
        'SocketRocket/Internal/IOConsumer',
        'SocketRocket/Internal/Proxy',
        'SocketRocket/Internal/RunLoop',
        'SocketRocket/Internal/Security',
        'SocketRocket/Internal/Utilities',
      ],
      compilerFlags: ['-Wno-everything'],
    },
  },
];

module.exports = {dependencies, platforms};
