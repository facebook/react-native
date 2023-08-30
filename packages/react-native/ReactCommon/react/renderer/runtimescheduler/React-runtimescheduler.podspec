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

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.07.22.00'

header_search_paths = [
    "\"$(PODS_ROOT)/RCT-Folly\"",
]

if ENV['USE_FRAMEWORKS']
  header_search_paths << "\"$(PODS_TARGET_SRCROOT)/../../..\"" #this is needed to allow the RuntimeScheduler access its own files
  header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers\""
end

Pod::Spec.new do |s|
  s.name                   = "React-runtimescheduler"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = { :ios => min_ios_version_supported }
  s.source                 = source
  s.source_files           = "**/*.{cpp,h}"
  s.compiler_flags         = folly_compiler_flags
  s.header_dir             = "react/renderer/runtimescheduler"
  s.exclude_files          = "tests"
  s.pod_target_xcconfig    = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    "HEADER_SEARCH_PATHS" => header_search_paths.join(' ')}

  if ENV['USE_FRAMEWORKS']
    s.module_name            = "React_runtimescheduler"
    s.header_mappings_dir  = "../../.."
  end

  s.dependency "React-jsi"
  s.dependency "React-runtimeexecutor"
  s.dependency "React-callinvoker"
  s.dependency "React-debug"
  s.dependency "glog"
  s.dependency "RCT-Folly", folly_version

  if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
    s.dependency "hermes-engine"
  else
    s.dependency "React-jsi"
  end

end
