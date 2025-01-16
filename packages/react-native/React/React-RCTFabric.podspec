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
boost_config = get_boost_config()
boost_compiler_flags = boost_config[:compiler_flags]
new_arch_flags = ENV['RCT_NEW_ARCH_ENABLED'] == '1' ? ' -DRCT_NEW_ARCH_ENABLED=1' : ''

header_search_paths = [
  "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"",
  "\"$(PODS_ROOT)/boost\"",
  "\"$(PODS_ROOT)/DoubleConversion\"",
  "\"$(PODS_ROOT)/fast_float/include\"",
  "\"$(PODS_ROOT)/fmt/include\"",
  "\"$(PODS_ROOT)/RCT-Folly\"",
  "\"$(PODS_ROOT)/Headers/Private/React-Core\"",
  "\"$(PODS_ROOT)/Headers/Private/Yoga\"",
  "\"$(PODS_ROOT)/Headers/Public/ReactCodegen\"",
]

if ENV['USE_FRAMEWORKS']
  create_header_search_path_for_frameworks("React-RCTFabric", :framework_name => "RCTFabric")
    .each { |search_path| header_search_paths << "\"#{search_path}\""}
end

module_name = "RCTFabric"
header_dir = "React"

Pod::Spec.new do |s|
  s.name                   = "React-RCTFabric"
  s.version                = version
  s.summary                = "RCTFabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "Fabric/**/*.{c,h,m,mm,S,cpp}"
  s.exclude_files          = "**/tests/*",
                             "**/android/*",
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags + new_arch_flags
  s.header_dir             = header_dir
  s.module_name            = module_name
  s.weak_framework         = "JavaScriptCore"
  s.framework              = "MobileCoreServices"
  s.pod_target_xcconfig    = {
    "HEADER_SEARCH_PATHS" => header_search_paths,
    "OTHER_CFLAGS" => "$(inherited) " + folly_compiler_flags + new_arch_flags,
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard()
  }.merge!(ENV['USE_FRAMEWORKS'] != nil ? {
    "PUBLIC_HEADERS_FOLDER_PATH" => "#{module_name}.framework/Headers/#{header_dir}"
  }: {})

  s.dependency "React-Core"
  s.dependency "React-RCTImage"
  s.dependency "RCT-Folly/Fabric", folly_version
  s.dependency "glog"
  s.dependency "Yoga"
  s.dependency "React-RCTText"
  s.dependency "React-jsi"

  add_dependency(s, "React-FabricImage")
  add_dependency(s, "React-Fabric", :additional_framework_paths => [
    "react/renderer/components/view/platform/cxx",
    "react/renderer/imagemanager/platform/ios",
  ])
  add_dependency(s, "React-FabricComponents", :additional_framework_paths => [
    "react/renderer/textlayoutmanager/platform/ios",
    "react/renderer/components/textinput/platform/ios",
  ]);

  add_dependency(s, "React-graphics", :additional_framework_paths => ["react/renderer/graphics/platform/ios"])
  add_dependency(s, "React-ImageManager")
  add_dependency(s, "React-featureflags")
  add_dependency(s, "React-debug")
  add_dependency(s, "React-utils")
  add_dependency(s, "React-performancetimeline")
  add_dependency(s, "React-rendererdebug")
  add_dependency(s, "React-rendererconsistency")
  add_dependency(s, "React-runtimescheduler")
  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
  add_dependency(s, "React-jsinspectortracing", :framework_name => 'jsinspector_moderntracing')

  if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
    s.dependency "hermes-engine"
  else
    s.dependency "React-jsc"
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = "Tests/**/*.{mm}"
    test_spec.framework = "XCTest"
  end
end
