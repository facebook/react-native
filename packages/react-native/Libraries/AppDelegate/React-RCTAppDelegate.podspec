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

folly_flags = ' -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1'
folly_compiler_flags = folly_flags + ' ' + '-Wno-comma -Wno-shorten-64-to-32'

is_new_arch_enabled = ENV["RCT_NEW_ARCH_ENABLED"] == "1"
use_hermes =  ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == '1'

new_arch_enabled_flag = (is_new_arch_enabled ? " -DRCT_NEW_ARCH_ENABLED" : "")
is_fabric_enabled = is_new_arch_enabled || ENV["RCT_FABRIC_ENABLED"]
fabric_flag = (is_fabric_enabled ? " -DRN_FABRIC_ENABLED" : "")
hermes_flag = (use_hermes ? " -DUSE_HERMES" : "")
other_cflags = "$(inherited)" + folly_flags + new_arch_enabled_flag + fabric_flag + hermes_flag

header_search_paths = [
  "$(PODS_TARGET_SRCROOT)/../../ReactCommon",
  "$(PODS_ROOT)/Headers/Private/React-Core",
  "$(PODS_ROOT)/boost",
  "$(PODS_ROOT)/DoubleConversion",
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
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "DEFINES_MODULE" => "YES"
  }
  s.user_target_xcconfig   = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/React-Core\""}

  use_hermes = ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == "1"

  s.dependency "React-Core"
  s.dependency "RCT-Folly"
  s.dependency "RCTRequired"
  s.dependency "RCTTypeSafety"
  s.dependency "React-RCTNetwork"
  s.dependency "React-RCTImage"
  s.dependency "React-CoreModules"
  s.dependency "React-nativeconfig"

  add_dependency(s, "ReactCommon", :subspec => "turbomodule/core", :additional_framework_paths => ["react/nativemodule/core"])
  add_dependency(s, "React-NativeModulesApple")
  add_dependency(s, "React-runtimescheduler")
  add_dependency(s, "React-RCTFabric", :framework_name => "RCTFabric")

  if is_new_arch_enabled
    add_dependency(s, "React-RuntimeCore")
    add_dependency(s, "React-RuntimeApple")
    if use_hermes
      s.dependency "React-RuntimeHermes"
    end
  end

  if use_hermes
    s.dependency "React-hermes"
  else
    s.dependency "React-jsc"
  end

  if is_new_arch_enabled
    add_dependency(s, "React-Fabric", :additional_framework_paths => ["react/renderer/components/view/platform/cxx"])
    add_dependency(s, "React-graphics", :additional_framework_paths => ["react/renderer/graphics/platform/ios"])
    add_dependency(s, "React-utils")
    add_dependency(s, "React-debug")
    add_dependency(s, "React-rendererdebug")

    rel_path_from_pods_root_to_app = Pathname.new(ENV['APP_PATH']).relative_path_from(Pod::Config.instance.installation_root)
    rel_path_from_pods_to_app = Pathname.new(ENV['APP_PATH']).relative_path_from(File.join(Pod::Config.instance.installation_root, 'Pods'))


    s.script_phases = {
      :name => "Generate Legacy Components Interop",
      :script => "
WITH_ENVIRONMENT=\"$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh\"
source $WITH_ENVIRONMENT
${NODE_BINARY} ${REACT_NATIVE_PATH}/scripts/codegen/generate-legacy-interop-components.js -p #{rel_path_from_pods_to_app} -o ${REACT_NATIVE_PATH}/Libraries/AppDelegate
      ",
      :execution_position => :before_compile,
      :input_files => ["#{rel_path_from_pods_root_to_app}/react-native.config.js"],
      :output_files => ["${REACT_NATIVE_PATH}/Libraries/AppDelegate/RCTLegacyInteropComponents.mm"],
    }
  end
end
