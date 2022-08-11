# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.07.22.00'

Pod::Spec.new do |s|
  s.name                   = "React-RCTTest"
  s.version                = version
  s.summary                = "Tools for integration and snapshot testing."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4", :tvos => "12.4" }
  s.compiler_flags         = folly_compiler_flags + ' -Wno-nullability-completeness'
  s.source                 = source
  s.source_files           = "**/*.{h,m,mm}"
  s.preserve_paths         = "package.json", "LICENSE", "LICENSE-docs"
  s.framework              = "XCTest"
  s.header_dir             = "RCTTest"
  s.pod_target_xcconfig    = {
                             "USE_HEADERMAP" => "YES",
                             "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
                             "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/RCT-Folly\""
                           }

  s.dependency "RCT-Folly", folly_version
  s.dependency "React-Core", version
  s.dependency "React-CoreModules", version
  s.dependency "ReactCommon/turbomodule/core", version
  s.dependency "React-jsi", version
end
