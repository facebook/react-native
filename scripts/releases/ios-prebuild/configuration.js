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

const platforms /*: $ReadOnlyArray<Platform> */ = [
  'ios',
  'ios-simulator',
  'macos',
  'mac-catalyst',
  'tvos',
  'tvos-simulator',
  'xros',
  'xros-simulator',
];

const CPP_STANDARD = 'c++20';

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
      headers: ['src/glog/*.h'],
      resources: ['../third-party-podspecs/glog/PrivacyInfo.xcprivacy'],
      headerSkipFolderNames: 'src',
    },
    settings: {
      publicHeaderFiles: './headers',
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
      headerTargetFolder: 'double-conversion',
      headerSkipFolderNames: 'src',
    },
    settings: {
      publicHeaderFiles: './headers',
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
      compilerFlags: ['-Wno-everything', `-std=${CPP_STANDARD}`],
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
      publicHeaderFiles: './',
      headerSearchPaths: ['./'],
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
      compilerFlags: ['-Wno-everything', `-std=${CPP_STANDARD}`],
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
  {
    name: 'folly',
    version: '0.9.0',
    disabled: false,
    url: new URL(
      'https://github.com/facebook/folly/archive/refs/tags/v2024.11.18.00.tar.gz',
    ),
    files: {
      sources: [
        // Common:
        'folly/String.cpp',
        'folly/Conv.cpp',
        'folly/Demangle.cpp',
        'folly/FileUtil.cpp',
        'folly/Format.cpp',
        'folly/lang/SafeAssert.cpp',
        'folly/lang/ToAscii.cpp',
        'folly/ScopeGuard.cpp',
        'folly/Unicode.cpp',
        'folly/json/dynamic.cpp',
        'folly/json/json.cpp',
        'folly/json/json_pointer.cpp',
        'folly/container/detail/F14Table.cpp',
        'folly/detail/Demangle.cpp',
        'folly/detail/FileUtilDetail.cpp',
        'folly/detail/SplitStringSimd.cpp',
        'folly/detail/StaticSingletonManager.cpp',
        'folly/detail/UniqueInstance.cpp',
        'folly/hash/SpookyHashV2.cpp',
        'folly/lang/CString.cpp',
        'folly/lang/Exception.cpp',
        'folly/memory/ReentrantAllocator.cpp',
        'folly/memory/detail/MallocImpl.cpp',
        'folly/net/NetOps.cpp',
        'folly/portability/SysUio.cpp',
        'folly/synchronization/SanitizeThread.cpp',
        'folly/system/AtFork.cpp',
        'folly/system/ThreadId.cpp',
        'folly/*.h',
        'folly/algorithm/simd/*.h',
        'folly/algorithm/simd/detail/*.h',
        'folly/chrono/*.h',
        'folly/container/*.h',
        'folly/container/detail/*.h',
        'folly/detail/*.h',
        'folly/functional/*.h',
        'folly/hash/*.h',
        'folly/json/*.h',
        'folly/lang/*.h',
        'folly/memory/*.h',
        'folly/memory/detail/*.h',
        'folly/net/*.h',
        'folly/net/detail/*.h',
        'folly/portability/*.h',
        'folly/system/*.h',
        // Fabric:
        'folly/SharedMutex.cpp',
        'folly/concurrency/CacheLocality.cpp',
        'folly/detail/Futex.cpp',
        'folly/synchronization/ParkingLot.cpp',
        'folly/concurrency/CacheLocality.h',
        'folly/synchronization/*.h',
        'folly/system/ThreadId.h',
      ],
      headers: [
        'folly/*.h',
        'folly/algorithm/simd/*.h',
        'folly/algorithm/simd/detail/*.h',
        'folly/chrono/*.h',
        'folly/container/*.h',
        'folly/container/detail/*.h',
        'folly/detail/*.h',
        'folly/functional/*.h',
        'folly/hash/*.h',
        'folly/json/*.h',
        'folly/lang/*.h',
        'folly/memory/*.h',
        'folly/memory/detail/*.h',
        'folly/net/*.h',
        'folly/net/detail/*.h',
        'folly/portability/*.h',
        'folly/system/*.h',
      ],
      // TODO: When including this we get "failed to scan dependencies" error
      // resources: ['../third-party-podspecs/RCT-Folly/PrivacyInfo.xcprivacy'],
    },
    dependencies: [
      'glog',
      'double-conversion',
      'fmt',
      'boost',
      'fast_float',
      'socket-rocket',
    ],
    settings: {
      publicHeaderFiles: './',
      headerSearchPaths: ['./'],
      compilerFlags: [
        '-Wno-everything',
        `-std=${CPP_STANDARD}`,
        '-faligned-new',
        '-Wno-shorten-64-to-32',
        '-Wno-comma',
      ],
      defines: [
        {name: 'USE_HEADERMAP', value: 'NO'},
        {name: 'DEFINES_MODULE', value: 'YES'},
        {name: 'FOLLY_NO_CONFIG'},
        {name: 'FOLLY_MOBILE', value: '1'},
        {name: 'FOLLY_HAVE_PTHREAD', value: '1'},
        {name: 'FOLLY_USE_LIBCPP', value: '1'},
        {name: 'FOLLY_CFG_NO_COROUTINES', value: '1'},
        {name: 'FOLLY_HAVE_CLOCK_GETTIME', value: '1'},
      ],
      linkedLibraries: ['c++abi'],
      linkerSettings: ['-Wl,-U,_jump_fcontext', '-Wl,-U,_make_fcontext'],
    },
  },
];

module.exports = {dependencies, platforms};
