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

use_frameworks = ENV['USE_FRAMEWORKS'] != nil

header_dir = 'jsinspector-modern'
module_name = "jsinspector_modern"
Pod::Spec.new do |s|
  s.name                   = "React-jsinspector"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "*.{cpp,h,def}"
  s.header_dir             = 'jsinspector-modern'
  s.compiler_flags         = folly_compiler_flags
  s.pod_target_xcconfig    = {
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/..\" \"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/fmt/include\"",
                               "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                               "DEFINES_MODULE" => "YES"
  }.merge!(use_frameworks ? {
    "PUBLIC_HEADERS_FOLDER_PATH" => "#{module_name}.framework/Headers/#{header_dir}"
  } : {})

  if use_frameworks
    s.module_name = module_name
  end

  s.dependency "glog"
  s.dependency "RCT-Folly", folly_version
  s.dependency "React-featureflags"
  s.dependency "DoubleConversion"
  s.dependency "React-runtimeexecutor", version
  s.dependency "React-jsi"
  if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
    s.dependency "hermes-engine"
  end

end
