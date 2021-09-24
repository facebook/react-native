# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

react_native_path = "../.."
require_relative "#{react_native_path}/scripts/react_native_pods.rb"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.06.28.00-v2'

Pod::Spec.new do |s|
  s.name                   = "FBReactNativeSpec"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "11.0" }
  s.compiler_flags         = folly_compiler_flags + ' -Wno-nullability-completeness'
  s.source                 = source
  s.source_files           = "**/FBReactNativeSpec*.{h,mm}"
  s.header_dir             = "FBReactNativeSpec"

  s.pod_target_xcconfig    = {
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/React/FBReactNativeSpec\" \"$(PODS_ROOT)/RCT-Folly\""
                             }

  s.dependency "RCT-Folly", folly_version
  s.dependency "RCTRequired", version
  s.dependency "RCTTypeSafety", version
  s.dependency "React-Core", version
  s.dependency "React-jsi", version
  s.dependency "ReactCommon/turbomodule/core", version

  use_react_native_codegen!(s, {
    :react_native_path => react_native_path,
    :js_srcs_dir => "#{react_native_path}/Libraries",
    :library_name => "FBReactNativeSpec",
    :library_type => "modules",
    :output_dir => "#{react_native_path}/React/FBReactNativeSpec/FBReactNativeSpec"
  })
end
