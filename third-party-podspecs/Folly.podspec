# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

Pod::Spec.new do |spec|
  spec.name = 'Folly'
  spec.version = '2018.10.22.00'
  spec.license = { :type => 'Apache License, Version 2.0' }
  spec.homepage = 'https://github.com/facebook/folly'
  spec.summary = 'An open-source C++ library developed and used at Facebook.'
  spec.authors = 'Facebook'
  spec.source = { :git => 'https://github.com/facebook/folly.git',
                  :tag => "v#{spec.version}" }
  spec.module_name = 'folly'
  spec.dependency 'boost-for-react-native'
  spec.dependency 'DoubleConversion'
  spec.dependency 'glog'
  spec.dependency 'libevent'
  spec.compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_HAVE_PTHREAD=1'
  spec.source_files = 'folly/String.cpp',
                      'folly/Conv.cpp',
                      'folly/Demangle.cpp',
                      'folly/Format.cpp',
                      'folly/FileUtil.cpp',
                      'folly/ScopeGuard.cpp',
                      'folly/StringBase.cpp',
                      'folly/Unicode.cpp',
                      'folly/dynamic.cpp',
                      'folly/json.cpp',
                      'folly/json_pointer.cpp',
                      'folly/container/detail/F14Table.cpp',
                      'folly/detail/Demangle.cpp',
                      'folly/detail/AtFork.cpp',
                      'folly/detail/MemoryIdler.cpp',
                      'folly/detail/StaticSingletonManager.cpp',
                      'folly/hash/SpookyHashV2.cpp',
                      'folly/futures/Future.cpp',
                      'folly/lang/Assume.cpp',
                      'folly/lang/ColdClass.cpp',
                      'folly/portability/BitsFunctexcept.cpp',
                      'folly/memory/detail/MallocImpl.cpp',
                      'folly/memory/MallctlHelper.cpp',
                      'folly/futures/ThreadWheelTimekeeper.cpp',
                      'folly/Executor.cpp',
                      'folly/executors/InlineExecutor.cpp',
                      'folly/executors/TimedDrivableExecutor.cpp',
                      'folly/ExceptionWrapper.cpp',
                      'folly/io/async/Request.cpp',
                      'folly/detail/ThreadLocalDetail.cpp',
                      'folly/SharedMutex.cpp',
                      'folly/concurrency/CacheLocality.cpp',
                      'folly/detail/Futex.cpp',
                      'folly/portability/SysUio.cpp',
                      'folly/synchronization/ParkingLot.cpp',
                      'folly/synchronization/Hazptr.cpp',
                      'folly/io/async/HHWheelTimer.cpp',
                      'folly/synchronization/WaitOptions.cpp',
                      'folly/synchronization/AsymmetricMemoryBarrier.cpp',
                      'folly/io/async/AsyncTimeout.cpp',
                      'folly/io/async/EventBase.cpp',
                      'folly/io/async/EventHandler.cpp',
                      'folly/system/ThreadName.cpp',
                      'folly/Singleton.cpp',
                      'folly/io/async/VirtualEventBase.cpp',
                      'folly/io/async/TimeoutManager.cpp',
                      'folly/lang/SafeAssert.cpp'
  # workaround for https://github.com/facebook/react-native/issues/14326
  spec.preserve_paths = 'folly/*.h',
                        'folly/container/*.h',
                        'folly/container/detail/*.h',
                        'folly/detail/*.h',
                        'folly/functional/*.h',
                        'folly/hash/*.h',
                        'folly/lang/*.h',
                        'folly/futures/*.h',
                        'folly/futures/detail/*.h',
                        'folly/executors/*.h',
                        'folly/concurrency/*.h',
                        'folly/system/*.h',
                        'folly/synchronization/*.h',
                        'folly/synchronization/detail/*.h',
                        'folly/io/async/*.h',
                        'folly/tracing/*.h',
                        'folly/experimental/*.h',
                        'folly/memory/*.h',
                        'folly/memory/detail/*.h',
                        'folly/portability/*.h'
  spec.libraries           = "stdc++"
  spec.xcconfig = {
    'USE_HEADERMAP' => 'NO',
  }
  spec.header_mappings_dir = '.'
  spec.pod_target_xcconfig = { "USE_HEADERMAP" => "NO",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/DoubleConversion\"" }

  # Pinning to the same version as React.podspec.
  spec.platforms = { :ios => "9.0", :tvos => "9.2" }
end
