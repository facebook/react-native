# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "..", "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  source_files = "**/*.{m,mm,cpp,h}"
  header_search_paths = [
    "\"$(PODS_ROOT)/boost\"",
    "\"$(PODS_TARGET_SRCROOT)/../../../\"",
    "\"$(PODS_TARGET_SRCROOT)\"",
    "\"$(PODS_ROOT)/RCT-Folly\"",
  ]

  s.name                   = "React-ImageManager"
  s.version                = version
  s.summary                = "Fabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.source                 = source
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
  s.source_files           = source_files
  s.header_dir             = "react/renderer/imagemanager"

  if ENV['USE_FRAMEWORKS']
    s.module_name            = "React_ImageManager"
    s.header_mappings_dir  = "./"
    header_search_paths = header_search_paths + [
      "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\"",
      "\"$(PODS_ROOT)/DoubleConversion\"",
      "\"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers\"",
      "\"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\"",
    ]
  end

  s.pod_target_xcconfig  = {
    "USE_HEADERMAP" => "NO",
    "HEADER_SEARCH_PATHS" => header_search_paths.join(" "),
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
  }

  s.dependency "RCT-Folly/Fabric"
  s.dependency "React-Fabric"
  s.dependency "React-Core/Default"
  s.dependency "React-RCTImage"
end
