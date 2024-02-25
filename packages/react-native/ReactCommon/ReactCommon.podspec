# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
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

boost_compiler_flags = '-Wno-documentation'
using_hermes = ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == "1"
Pod::Spec.new do |s|
  s.name                   = "ReactCommon"
  s.module_name            = "ReactCommon"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.header_dir             = "ReactCommon" # Use global header_dir for all subspecs for use_frameworks! compatibility
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
  s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/fmt/include\" \"$(PODS_ROOT)/Headers/Private/React-Core\"",
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
                               "GCC_WARN_PEDANTIC" => "YES" }
  if ENV['USE_FRAMEWORKS']
    s.header_mappings_dir     = './'
  end

  # TODO (T48588859): Restructure this target to align with dir structure: "react/nativemodule/..."
  # Note: Update this only when ready to minimize breaking changes.
  s.subspec "turbomodule" do |ss|
    ss.dependency "React-callinvoker", version
    ss.dependency "React-perflogger", version
    ss.dependency "React-cxxreact", version
    ss.dependency "React-jsi", version
    ss.dependency "RCT-Folly", folly_version
    ss.dependency "React-logger", version
    ss.dependency "DoubleConversion"
    ss.dependency "fmt", "9.1.0"
    ss.dependency "glog"
    if using_hermes
      ss.dependency "hermes-engine"
    end

    ss.subspec "bridging" do |sss|
      sss.dependency           "React-jsi", version
      sss.source_files         = "react/bridging/**/*.{cpp,h}"
      sss.exclude_files        = "react/bridging/tests"
      sss.header_dir           = "react/bridging"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
      if using_hermes
        sss.dependency "hermes-engine"
      end
    end

    ss.subspec "core" do |sss|
      sss.source_files = "react/nativemodule/core/ReactCommon/**/*.{cpp,h}"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_CONFIGURATION_BUILD_DIR)/React-debug/React_debug.framework/Headers\" \"$(PODS_CONFIGURATION_BUILD_DIR)/React-utils/React_utils.framework/Headers\"" }
      sss.dependency "React-debug", version
      sss.dependency "React-utils", version
    end
  end
end
