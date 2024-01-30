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
    "\"$(PODS_ROOT)/boost\"",
]

if ENV['USE_FRAMEWORKS']
  header_search_paths << "\"$(PODS_TARGET_SRCROOT)/../../..\"" # this is needed to allow the RuntimeScheduler access its own files
end

Pod::Spec.new do |s|
  s.name                   = "React-runtimescheduler"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "**/*.{cpp,h}"
  s.compiler_flags         = folly_compiler_flags
  s.header_dir             = "react/renderer/runtimescheduler"
  s.exclude_files          = "tests"
  s.pod_target_xcconfig    = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "HEADER_SEARCH_PATHS" => header_search_paths.join(' ')}

  if ENV['USE_FRAMEWORKS']
    s.module_name            = "React_runtimescheduler"
    s.header_mappings_dir  = "../../.."
  end

  s.dependency "React-runtimeexecutor"
  s.dependency "React-callinvoker"
  s.dependency "React-cxxreact"
  s.dependency "React-rendererdebug"
  s.dependency "React-utils"
  s.dependency "React-featureflags"
  s.dependency "glog"
  s.dependency "RCT-Folly", folly_version
  s.dependency "React-jsi"
  add_dependency(s, "React-debug")

  if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
    s.dependency "hermes-engine"
  else
    s.dependency "React-jsc"
  end

end
