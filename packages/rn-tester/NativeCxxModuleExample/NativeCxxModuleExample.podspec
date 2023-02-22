# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "../package.json")))

Pod::Spec.new do |s|
  s.name            = "NativeCxxModuleExample"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = "NativeCxxModuleExample"
  s.homepage        = "https://github.com/facebook/react-native.git"
  s.license         = "MIT"
  s.platforms       = { :ios => "12.4" }
  s.compiler_flags  = '-Wno-nullability-completeness'
  s.author          = "Meta Platforms, Inc. and its affiliates"
  s.source          = { :git => "https://github.com/facebook/react-native.git", :tag => "#{s.version}" }
  s.source_files    = "**/*.{h,cpp}"
  s.requires_arc    = true
  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
  }

  install_modules_dependencies(s)

  s.dependency "ReactCommon/turbomodule/core"
end
