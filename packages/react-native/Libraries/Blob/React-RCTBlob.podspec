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
  "\"$(PODS_ROOT)/RCT-Folly\"",
  "\"$(PODS_ROOT)/boost\"",
  "\"$(PODS_ROOT)/DoubleConversion\"",
  "\"$(PODS_ROOT)/fmt/include\"",
  "\"${PODS_ROOT}/Headers/Public/ReactCodegen/react/renderer/components\"",
]

Pod::Spec.new do |s|
  s.name                   = "React-RCTBlob"
  s.version                = version
  s.summary                = "An API for displaying iOS action sheets and share sheets."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.compiler_flags         = folly_compiler_flags + ' -Wno-nullability-completeness'
  s.source                 = source
  s.source_files           = "*.{h,m,mm}"
  s.preserve_paths         = "package.json", "LICENSE", "LICENSE-docs"
  s.header_dir             = "RCTBlob"
  s.pod_target_xcconfig    = {
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                               "HEADER_SEARCH_PATHS" => header_search_paths.join(' ')
                             }

  s.dependency "DoubleConversion"
  s.dependency "fmt", "9.1.0"
  s.dependency "RCT-Folly", folly_version
  s.dependency "React-jsi"
  s.dependency "React-Core/RCTBlobHeaders"
  s.dependency "React-Core/RCTWebSocket"
  s.dependency "React-RCTNetwork"

  add_dependency(s, "ReactCodegen")
  add_dependency(s, "React-NativeModulesApple")
  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
  add_dependency(s, "ReactCommon", :subspec => "turbomodule/core", :additional_framework_paths => ["react/nativemodule/core"])

  if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
    s.dependency "hermes-engine"
  end
end
