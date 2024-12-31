# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "../" "package.json")))

boost_version = '1.83.0'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name            = "MyNativeView"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = "my-native-view"
  s.homepage        = "https://github.com/sota000/my-native-view.git"
  s.license         = "MIT"
  s.platforms       = min_supported_versions
  s.compiler_flags  = boost_compiler_flags + ' -Wno-nullability-completeness'
  s.author          = "Meta Platforms, Inc. and its affiliates"
  s.source          = { :git => "https://github.com/facebook/my-native-view.git", :tag => "#{s.version}" }
  s.pod_target_xcconfig    = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/boost\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCodegen/ReactCodegen.framework/Headers\"",
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard()
  }

  s.source_files    = "ios/**/*.{h,m,mm,cpp}"
  s.requires_arc    = true

  install_modules_dependencies(s)
end
