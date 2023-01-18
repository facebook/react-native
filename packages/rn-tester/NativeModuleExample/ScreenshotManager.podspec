# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# TODO: Delete me before merging

require "json"

package = JSON.parse(File.read(File.join(__dir__, "../package.json")))

Pod::Spec.new do |s|
  s.name            = "ScreenshotManager"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = "ScreenshotManager"
  s.homepage        = "https://github.com/facebook/react-native.git"
  s.license         = "MIT"
  s.platforms       = { :ios => "12.4", :osx => "10.15" } # [macOS]
  s.compiler_flags  = '-Wno-nullability-completeness'
  s.author          = "Facebook, Inc. and its affiliates"
  s.source          = { :git => "https://github.com/facebook/react-native.git", :tag => "#{s.version}" }

  s.source_files    = "**/*.{h,m,mm,swift}"
# [macOS
  s.ios.exclude_files = "ScreenshotMacOS.{h,mm}"
  s.osx.exclude_files = "Screenshot.{h,m}"
# macOS]
  s.requires_arc    = true

  install_modules_dependencies(s)

# [macOS
  s.osx.dependency "React-TurboModuleCxx-RNW"
  s.osx.pod_target_xcconfig = { "USE_HEADERMAP" => "YES",
                                "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
                                "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
                               }
# macOS]

  # s.dependency "..."

  # Enable codegen for this library
  use_react_native_codegen!(s, {
    :react_native_path => "../../..",
    :js_srcs_dir => "./",
    :library_type => "modules",
  })
end
