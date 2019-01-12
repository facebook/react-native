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
  spec.compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'
  spec.source_files = 'folly/String.cpp',
                      'folly/Conv.cpp',
                      'folly/Demangle.cpp',
                      'folly/Format.cpp',
                      'folly/ScopeGuard.cpp',
                      'folly/Unicode.cpp',
                      'folly/dynamic.cpp',
                      'folly/json.cpp',
                      'folly/json_pointer.cpp',
                      'folly/container/detail/F14Table.cpp',
                      'folly/detail/Demangle.cpp',
                      'folly/hash/SpookyHashV2.cpp',
                      'folly/lang/Assume.cpp',
                      'folly/lang/ColdClass.cpp',
                      'folly/memory/detail/MallocImpl.cpp'
  # workaround for https://github.com/facebook/react-native/issues/14326
  spec.preserve_paths = 'folly/*.h',
                        'folly/container/*.h',
                        'folly/container/detail/*.h',
                        'folly/detail/*.h',
                        'folly/functional/*.h',
                        'folly/hash/*.h',
                        'folly/lang/*.h',
                        'folly/memory/*.h',
                        'folly/memory/detail/*.h',
                        'folly/portability/*.h'
  spec.libraries           = "stdc++"
  spec.pod_target_xcconfig = { "USE_HEADERMAP" => "NO",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/DoubleConversion\"" }

  # Pinning to the same version as React.podspec.
  spec.platforms = { :ios => "9.0", :tvos => "9.2" }
end
