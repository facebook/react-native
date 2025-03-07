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
new_arch_flags = ENV['RCT_NEW_ARCH_ENABLED'] == '1' ? ' -DRCT_NEW_ARCH_ENABLED=1' : ''

header_search_paths = [
  "\"$(PODS_ROOT)/boost\"",
  "\"$(PODS_ROOT)/RCT-Folly\"",
  "\"$(PODS_ROOT)/DoubleConversion\"",
  "\"$(PODS_ROOT)/fast_float/include\"",
  "\"$(PODS_ROOT)/fmt/include\""
]

module_name = "RCTRuntime"
header_dir = "React"

Pod::Spec.new do |s|
  s.name                   = "React-RCTRuntime"
  s.version                = version
  s.summary                = "RCTRuntime for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "*.{h,mm}"
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags + new_arch_flags
  s.header_dir             = header_dir
  s.module_name          = module_name

  if ENV['USE_FRAMEWORKS']
    s.header_mappings_dir = "./"
  end

  s.pod_target_xcconfig    = {
    "HEADER_SEARCH_PATHS" => header_search_paths,
    "OTHER_CFLAGS" => "$(inherited) " + folly_compiler_flags + new_arch_flags,
    "DEFINES_MODULE" => "YES",
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard()
  }.merge!(ENV['USE_FRAMEWORKS'] != nil ? {
    "PUBLIC_HEADERS_FOLDER_PATH" => "#{module_name}.framework/Headers/#{header_dir}"
  }: {})

  s.dependency "React-Core"
  s.dependency "RCT-Folly/Fabric", folly_version
  s.dependency "glog"
  s.dependency "React-jsi"
  add_dependency(s, "React-jsitooling", :framework_name => "JSITooling")
  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
  add_dependency(s, "React-jsinspectortracing", :framework_name => 'jsinspector_moderntracing')

  add_dependency(s, "React-RuntimeCore")
  add_dependency(s, "React-RuntimeApple")

  if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
    s.dependency "hermes-engine"
    add_dependency(s, "React-RuntimeHermes")
    s.exclude_files = "RCTJscInstanceFactory.{h,mm}"
  elsif ENV['USE_THIRD_PARTY_JSC'] == '1'
    s.exclude_files = ["RCTHermesInstanceFactory.{mm,h}", "RCTJscInstanceFactory.{mm,h}"]
  else
    s.exclude_files = ["RCTHermesInstanceFactory.{mm,h}"]
  end
  depend_on_js_engine(s)
end
