# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "..", "package.json")))
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
    "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\"",
    "\"$(PODS_ROOT)/DoubleConversion\"",
    "\"$(PODS_ROOT)/fast_float/include\"",
    "\"$(PODS_ROOT)/fmt/include\""
]

if ENV['USE_FRAMEWORKS']
  header_search_paths << "\"$(PODS_TARGET_SRCROOT)/../../..\"" # this is needed to allow the Renderer/Debug access its own files
end

Pod::Spec.new do |s|
  s.name                   = "React-rendererdebug"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "**/*.{cpp,h,mm}"
  s.compiler_flags         = folly_compiler_flags
  s.header_dir             = "react/renderer/debug"
  s.exclude_files          = "tests"
  s.pod_target_xcconfig    = {
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
    "HEADER_SEARCH_PATHS" => header_search_paths.join(' '),
    "DEFINES_MODULE" => "YES"
  }

  if ENV['USE_FRAMEWORKS']
    s.module_name            = "React_rendererdebug"
    s.header_mappings_dir  = "../../.."
  end

  s.dependency "RCT-Folly", folly_version
  s.dependency "DoubleConversion"
  s.dependency "fast_float", "6.1.4"
  s.dependency "fmt", "11.0.2"
  add_dependency(s, "React-debug")
end
