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

header_search_paths = [
  "\"$(PODS_ROOT)/boost\"",
  "\"$(PODS_ROOT)/DoubleConversion\"",
  "\"$(PODS_ROOT)/fast_float/include\"",
  "\"$(PODS_ROOT)/fmt/include\"",
  "\"$(PODS_ROOT)/RCT-Folly\"",
]

if ENV['USE_FRAMEWORKS']
  header_search_paths << "\"$(PODS_TARGET_SRCROOT)/..\""
end

header_dir = 'jsinspector-modern'
module_name = "jsinspector_modern"

Pod::Spec.new do |s|
  s.name                   = "React-jsinspector"
  s.version                = version
  s.summary                = "React Native subsystem for modern debugging over the Chrome DevTools Protocol (CDP)"
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "*.{cpp,h}"
  s.header_dir             = header_dir
  s.compiler_flags         = folly_compiler_flags
  s.pod_target_xcconfig    = {
    "HEADER_SEARCH_PATHS" => header_search_paths.join(' '),
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                               "DEFINES_MODULE" => "YES"
  }.merge!(ENV['USE_FRAMEWORKS'] ? {
    "PUBLIC_HEADERS_FOLDER_PATH" => "#{module_name}.framework/Headers/#{header_dir}"
  } : {})

  if ENV['USE_FRAMEWORKS']
    s.module_name = module_name
  end

  s.dependency "glog"
  s.dependency "RCT-Folly"
  s.dependency "React-featureflags"
  s.dependency "DoubleConversion"
  s.dependency "React-runtimeexecutor", version
  s.dependency "React-jsi"
  add_dependency(s, "React-jsinspectortracing", :framework_name => 'jsinspector_moderntracing')
  s.dependency "React-perflogger", version
  if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
    s.dependency "hermes-engine"
  end

end
