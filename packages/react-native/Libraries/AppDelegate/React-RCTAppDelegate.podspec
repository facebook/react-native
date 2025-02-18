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

is_new_arch_enabled = ENV["RCT_NEW_ARCH_ENABLED"] != "0"
use_hermes = ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == '1'

new_arch_enabled_flag = (is_new_arch_enabled ? " -DRCT_NEW_ARCH_ENABLED=1" : "")
hermes_flag = (use_hermes ? " -DUSE_HERMES=1" : "")
use_third_party_jsc_flag = ENV['USE_THIRD_PARTY_JSC'] == '1' ? " -DUSE_THIRD_PARTY_JSC=1" : ""
other_cflags = "$(inherited) " + folly_compiler_flags + new_arch_enabled_flag + hermes_flag  + use_third_party_jsc_flag

header_search_paths = [
  "$(PODS_TARGET_SRCROOT)/../../ReactCommon",
  "$(PODS_ROOT)/Headers/Private/React-Core",
  "$(PODS_ROOT)/boost",
  "$(PODS_ROOT)/DoubleConversion",
  "$(PODS_ROOT)/fast_float/include",
  "$(PODS_ROOT)/fmt/include",
  "$(PODS_ROOT)/RCT-Folly",
  "${PODS_ROOT}/Headers/Public/FlipperKit",
  "$(PODS_ROOT)/Headers/Public/ReactCommon",
  "$(PODS_ROOT)/Headers/Public/React-RCTFabric",
  "$(PODS_ROOT)/Headers/Private/Yoga",
].concat(use_hermes ? [
  "$(PODS_ROOT)/Headers/Public/React-hermes",
  "$(PODS_ROOT)/Headers/Public/hermes-engine"
] : [])

Pod::Spec.new do |s|
  s.name            = "React-RCTAppDelegate"
  s.version                = version
  s.summary                = "An utility library to simplify common operations for the New Architecture"
  s.homepage               = "https://reactnative.dev/"
  s.documentation_url      = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files            = "**/*.{c,h,m,mm,S,cpp}"

  # This guard prevent to install the dependencies when we run `pod install` in the old architecture.
  s.compiler_flags = other_cflags
  s.pod_target_xcconfig    = {
    "HEADER_SEARCH_PATHS" => header_search_paths,
    "OTHER_CPLUSPLUSFLAGS" => other_cflags,
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
    "DEFINES_MODULE" => "YES"
  }
  s.user_target_xcconfig   = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/React-Core\" \"$(PODS_ROOT)/Headers/Private/Yoga\""}

  s.dependency "React-Core"
  s.dependency "RCT-Folly", folly_version
  s.dependency "RCTRequired"
  s.dependency "RCTTypeSafety"
  s.dependency "React-RCTNetwork"
  s.dependency "React-RCTImage"
  s.dependency "React-CoreModules"
  s.dependency "React-RCTFBReactNativeSpec"
  s.dependency "React-defaultsnativemodule"

  add_dependency(s, "ReactCommon", :subspec => "turbomodule/core", :additional_framework_paths => ["react/nativemodule/core"])
  add_dependency(s, "React-NativeModulesApple")
  add_dependency(s, "React-runtimescheduler")
  add_dependency(s, "React-RCTFabric", :framework_name => "RCTFabric")
  add_dependency(s, "React-RuntimeCore")
  add_dependency(s, "React-RuntimeApple")
  add_dependency(s, "React-Fabric", :additional_framework_paths => ["react/renderer/components/view/platform/cxx"])
  add_dependency(s, "React-graphics", :additional_framework_paths => ["react/renderer/graphics/platform/ios"])
  add_dependency(s, "React-utils")
  add_dependency(s, "React-debug")
  add_dependency(s, "React-rendererdebug")
  add_dependency(s, "React-featureflags")
  add_dependency(s, "React-jsitooling", :framework_name => "JSITooling")
  add_dependency(s, "React-RCTRuntime", :framework_name => "RCTRuntime")

  depend_on_js_engine(s)
end
