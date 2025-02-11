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

folly_config = get_folly_config()
folly_compiler_flags = folly_config[:compiler_flags]
folly_version = folly_config[:version]

boost_config = get_boost_config()
boost_compiler_flags = boost_config[:compiler_flags]

using_hermes = ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == "1"

Pod::Spec.new do |s|
    s.name                   = "React-NativeModulesApple"
    s.module_name            = "React_NativeModulesApple"
    s.header_dir             = "ReactCommon" # Use global header_dir for all subspecs for use_frameworks! compatibility
    s.version                = version
    s.summary                = "-"
    s.homepage               = "https://reactnative.dev/"
    s.license                = package["license"]
    s.author                 = "Meta Platforms, Inc. and its affiliates"
    s.platforms              = min_supported_versions
    s.source                 = source
    s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
    s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/fast_float/include\" \"$(PODS_ROOT)/fmt/include\" \"$(PODS_ROOT)/Headers/Private/React-Core\"",
                                "USE_HEADERMAP" => "YES",
                                "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                                "GCC_WARN_PEDANTIC" => "YES" }
    if ENV['USE_FRAMEWORKS']
        s.header_mappings_dir     = './'
    end

    s.source_files = "ReactCommon/**/*.{mm,cpp,h}"

    s.dependency "glog"
    s.dependency "ReactCommon/turbomodule/core"
    s.dependency "ReactCommon/turbomodule/bridging"
    s.dependency "React-callinvoker"
    s.dependency "React-Core"
    s.dependency "React-cxxreact"
    s.dependency "React-jsi"
    s.dependency "React-runtimeexecutor"
    add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')

    if using_hermes
      s.dependency "hermes-engine"
    else
      s.dependency "React-jsc"
    end
end
