# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

folly_config = get_folly_config()
folly_compiler_flags = folly_config[:compiler_flags]
folly_version = folly_config[:version]

header_search_paths = [
  "\"$(PODS_ROOT)/boost\"",
  "\"$(PODS_TARGET_SRCROOT)/React/CoreModules\"",
  "\"$(PODS_ROOT)/RCT-Folly\"",
  "\"$(PODS_ROOT)/DoubleConversion\"",
  "\"$(PODS_ROOT)/fast_float/include\"",
  "\"$(PODS_ROOT)/fmt/include\"",
  "\"${PODS_ROOT}/Headers/Public/ReactCodegen/react/renderer/components\"",
]

Pod::Spec.new do |s|
  s.name                   = "React-CoreModules"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.compiler_flags         = folly_compiler_flags + ' -Wno-nullability-completeness'
  s.source                 = source
  s.source_files           = "**/*.{c,m,mm,cpp}"
  # [macOS
                             "**/MacOS/*"
  s.osx.exclude_files     =  "{RCTFPSGraph,RCTPerfMonitor,RCTPlatform}.*"
  # macOS]
  s.header_dir             = "CoreModules"
  s.pod_target_xcconfig    = {
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                               "HEADER_SEARCH_PATHS" => header_search_paths.join(" ")
                             }
  # [macOS Restrict UIKit to iOS and visionOS
  s.ios.framework = "UIKit" 
  s.visionos.framework = "UIKit" 
  s.osx.framework = "Appkit" 
  # macOS]
  s.dependency "DoubleConversion"
  s.dependency "fast_float"
  s.dependency "fmt"
  s.dependency "RCT-Folly"
  s.dependency "RCTTypeSafety"
  s.dependency "React-Core/CoreModulesHeaders"
  s.dependency "React-RCTImage"
  s.dependency "React-jsi"
  s.dependency 'React-RCTBlob'
  s.dependency "SocketRocket"
  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')

  add_dependency(s, "ReactCodegen")
  add_dependency(s, "ReactCommon", :subspec => "turbomodule/core", :additional_framework_paths => ["react/nativemodule/core"])
  add_dependency(s, "React-NativeModulesApple")
end
