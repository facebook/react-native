# coding: utf-8
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
boost_config = get_boost_config()
boost_compiler_flags = boost_config[:compiler_flags]

Pod::Spec.new do |s|
  s.name                   = "React-cxxreact"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "*.{cpp,h}"
  s.exclude_files          = "SampleCxxModule.*"
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
  s.pod_target_xcconfig    = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/fas_float/include\" \"$(PODS_ROOT)/fmt/include\" \"$(PODS_CONFIGURATION_BUILD_DIR)/React-debug/React_debug.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-runtimeexecutor/React_runtimeexecutor.framework/Headers\"",
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard()
  }
  s.header_dir             = "cxxreact"

  s.dependency "boost"
  s.dependency "DoubleConversion"
  s.dependency "fast_float", "6.1.4"
  s.dependency "fmt", "11.0.2"
  s.dependency "RCT-Folly", folly_version
  s.dependency "glog"
  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
  s.dependency "React-callinvoker", version
  s.dependency "React-runtimeexecutor", version
  s.dependency "React-perflogger", version
  s.dependency "React-jsi", version
  s.dependency "React-logger", version
  s.dependency "React-debug", version
  s.dependency "React-timing", version

  s.resource_bundles = {'React-cxxreact_privacy' => 'PrivacyInfo.xcprivacy'}

  if ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == "1"
    s.dependency 'hermes-engine'
  end
end
