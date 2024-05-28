# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "../../..", "package.json")))
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
folly_dep_name = 'RCT-Folly/Fabric'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name                   = "React-RuntimeHermes"
  s.version                = version
  s.summary                = "The React Native Runtime."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "hermes/*.{cpp,h}"
  s.header_dir             = "react/runtime/hermes"
  s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"${PODS_TARGET_SRCROOT}/../..\" \"${PODS_TARGET_SRCROOT}/../../hermes/executor\" \"$(PODS_ROOT)/boost\"",
                                "USE_HEADERMAP" => "YES",
                                "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
                                "GCC_WARN_PEDANTIC" => "YES" }
  s.compiler_flags       = folly_compiler_flags + ' ' + boost_compiler_flags

  if ENV['USE_FRAMEWORKS']
    s.header_mappings_dir     = './'
    s.module_name             = 'React_RuntimeHermes'
  end

  s.dependency folly_dep_name, folly_version
  s.dependency "React-nativeconfig"
  s.dependency "React-jsitracing"
  s.dependency "React-jsi"
  s.dependency "React-utils"
  s.dependency "React-RuntimeCore"
  s.dependency "React-featureflags"
  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')

  if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
    s.dependency "React-hermes"
    s.dependency "hermes-engine"
  else
    s.dependency "React-jsc"
    s.exclude_files = "hermes/*.{cpp,h}"
  end
end
