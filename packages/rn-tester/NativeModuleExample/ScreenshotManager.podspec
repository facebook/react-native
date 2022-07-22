# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "../package.json")))

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.07.22.00'

Pod::Spec.new do |s|
  s.name            = "ScreenshotManager"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = "ScreenshotManager"
  s.homepage        = "https://github.com/facebook/react-native.git"
  s.license         = "MIT"
  s.platforms       = { :ios => "12.4", :tvos => "12.4" }
  s.compiler_flags  = folly_compiler_flags + ' -Wno-nullability-completeness'
  s.author          = "Facebook, Inc. and its affiliates"
  s.source          = { :git => "https://github.com/facebook/react-native.git", :tag => "#{s.version}" }

  s.source_files    = "**/*.{h,m,mm,swift}"
  s.requires_arc    = true

  s.dependency "React-Core"
  s.dependency "RCT-Folly", folly_version

  # s.dependency "..."

  # Enable codegen for this library
  use_react_native_codegen!(s, {
    :react_native_path => "../../..",
    :js_srcs_dir => "./",
    :library_type => "modules",
  })
end
