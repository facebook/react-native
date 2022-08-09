# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# TODO: Delete me before merging

require "json"

package = JSON.parse(File.read(File.join(__dir__, "../package.json")))

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.06.28.00-v2'

Pod::Spec.new do |s|
  s.name            = "ScreenshotManager"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = "ScreenshotManager"
  s.homepage        = "https://github.com/facebook/react-native.git"
  s.license         = "MIT"
  s.platforms       = { :ios => "11.0", :osx => "10.15", :tvos => "11.0" } # TODO(macOS GH#774)
  s.compiler_flags  = folly_compiler_flags + ' -Wno-nullability-completeness'
  s.author          = "Facebook, Inc. and its affiliates"
  s.source          = { :git => "https://github.com/facebook/react-native.git", :tag => "#{s.version}" }

  s.source_files    = "**/*.{h,m,mm,swift}"
# [TODO(macOS GH#774)
  s.ios.exclude_files = "ScreenshotMacOS.{h,mm}"
  s.osx.exclude_files = "Screenshot.{h,m}"
# ]TODO(macOS GH#774)
  s.requires_arc    = true

  s.dependency "React"
  s.dependency "RCT-Folly", folly_version

# [TODO(macOS GH#774)
  s.osx.dependency "React-TurboModuleCxx-RNW"
  s.osx.pod_target_xcconfig = { "USE_HEADERMAP" => "YES",
                                "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost-for-react-native\"",
                                "CLANG_CXX_LANGUAGE_STANDARD" => "c++17" }
# ]TODO(macOS GH#774)

  # s.dependency "..."

  # Enable codegen for this library
  use_react_native_codegen!(s, {
    :react_native_path => "../../..",
    :js_srcs_dir => "./",
    :library_type => "modules",
  })
end
