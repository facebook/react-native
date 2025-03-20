# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

use_hermes = ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == '1'
use_hermes_flag = use_hermes ? "-DUSE_HERMES=1" : ""
use_third_party_jsc_flag = ENV['USE_THIRD_PARTY_JSC'] == '1' ? "-DUSE_THIRD_PARTY_JSC=1" : ""

header_subspecs = {
  'CoreModulesHeaders'          => 'React/CoreModules/**/*.h',
  'RCTActionSheetHeaders'       => 'Libraries/ActionSheetIOS/*.h',
  'RCTAnimationHeaders'         => 'Libraries/NativeAnimation/{Drivers/*,Nodes/*,*}.{h}',
  'RCTBlobHeaders'              => 'Libraries/Blob/{RCTBlobManager,RCTFileReaderModule}.h',
  'RCTImageHeaders'             => 'Libraries/Image/*.h',
  'RCTLinkingHeaders'           => 'Libraries/LinkingIOS/*.h',
  'RCTNetworkHeaders'           => 'Libraries/Network/*.h',
  'RCTPushNotificationHeaders'  => 'Libraries/PushNotificationIOS/*.h',
  'RCTSettingsHeaders'          => 'Libraries/Settings/*.h',
  'RCTTextHeaders'              => 'Libraries/Text/**/*.h',
  'RCTVibrationHeaders'         => 'Libraries/Vibration/*.h',
}

frameworks_search_paths = []
frameworks_search_paths << "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-hermes\"" if use_hermes

header_search_paths = [
  "$(PODS_TARGET_SRCROOT)/ReactCommon",
  "${PODS_ROOT}/Headers/Public/FlipperKit",
  "$(PODS_ROOT)/Headers/Public/ReactCommon",
].concat(use_hermes ? [
  "$(PODS_ROOT)/Headers/Public/React-hermes",
  "$(PODS_ROOT)/Headers/Public/hermes-engine"
] : [])

Pod::Spec.new do |s|
  s.name                   = "React-Core"
  s.version                = version
  s.summary                = "The core of React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.resource_bundle        = { "RCTI18nStrings" => ["React/I18n/strings/*.lproj"]}
  s.compiler_flags         = use_hermes_flag + ' ' + use_third_party_jsc_flag
  s.header_dir             = "React"
  s.weak_framework         = "JavaScriptCore"
  s.pod_target_xcconfig    = {
                               "HEADER_SEARCH_PATHS" => header_search_paths,
                               "DEFINES_MODULE" => "YES",
                               "GCC_PREPROCESSOR_DEFINITIONS" => "RCT_METRO_PORT=${RCT_METRO_PORT}",
                               "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                               "FRAMEWORK_SEARCH_PATHS" => frameworks_search_paths.join(" ")
                             }
  s.user_target_xcconfig   = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/React-Core\""}
  s.default_subspec        = "Default"

  s.subspec "Default" do |ss|
    ss.source_files           = "React/**/*.{c,h,m,mm,S,cpp}"
    exclude_files = [
      "React/CoreModules/**/*",
      "React/DevSupport/**/*",
      "React/Fabric/**/*",
      "React/FBReactNativeSpec/**/*",
      "React/Tests/**/*",
      "React/Inspector/**/*",
      "React/Runtime/**/*",
    ]
    # If we are using Hermes (the default is use hermes, so USE_HERMES can be nil), we don't have jsc installed
    # So we have to exclude the JSCExecutorFactory
    if use_hermes
      exclude_files = exclude_files.append("React/CxxBridge/JSCExecutorFactory.{h,mm}")
    elsif ENV['USE_THIRD_PARTY_JSC'] == '1'
      exclude_files = exclude_files.append("React/CxxBridge/JSCExecutorFactory.{h,mm}")
    end

    ss.exclude_files = exclude_files
    ss.private_header_files   = "React/Cxx*/*.h"
  end

  s.subspec "DevSupport" do |ss|
    ss.source_files = "React/DevSupport/*.{h,mm,m}",
                      "React/Inspector/*.{h,mm,m}"

    ss.dependency "React-Core/Default", version
    ss.dependency "React-Core/RCTWebSocket", version
    ss.private_header_files = "React/Inspector/RCTCxx*.h"
  end

  s.subspec "RCTWebSocket" do |ss|
    ss.source_files = "Libraries/WebSocket/*.{h,m}"
    ss.dependency "React-Core/Default", version
  end

  # Add a subspec containing just the headers for each
  # pod that should live under <React/*.h>
  header_subspecs.each do |name, headers|
    s.subspec name do |ss|
      ss.source_files = headers
      ss.dependency "React-Core/Default"
    end
  end

  s.dependency "React-cxxreact"
  s.dependency "React-perflogger"
  s.dependency "React-jsi"
  s.dependency "React-jsiexecutor"
  s.dependency "React-utils"
  s.dependency "React-featureflags"
  s.dependency "React-runtimescheduler"
  s.dependency "Yoga"

  s.resource_bundles = {'React-Core_privacy' => 'React/Resources/PrivacyInfo.xcprivacy'}

  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
  add_dependency(s, "React-jsinspectorcdp", :framework_name => 'jsinspector_moderncdp')
  add_dependency(s, "React-jsitooling", :framework_name => "JSITooling")
  add_dependency(s, "RCTDeprecation")

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
end
