# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

# package.json
package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                   = "React-hermes"
  s.version                = version
  s.summary                = "Hermes engine for React Native"
  s.homepage               = "https://reactnative.dev/"
  s.license                = package['license']
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "executor/*.{cpp,h}",
                             "inspector-modern/chrome/*.{cpp,h}",
  s.public_header_files    = "executor/HermesExecutorFactory.h"
  s.pod_target_xcconfig    = {
                               "HEADER_SEARCH_PATHS" => "\"${PODS_ROOT}/hermes-engine/destroot/include\" \"$(PODS_TARGET_SRCROOT)/..\"",
                               "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard()
                             }
  s.header_dir             = "reacthermes"
  s.dependency "React-cxxreact", version
  s.dependency "React-jsiexecutor", version
  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
  add_dependency(s, "React-jsinspectortracing", :framework_name => 'jsinspector_moderntracing')
  s.dependency "React-perflogger", version
  s.dependency "hermes-engine"
  s.dependency "React-jsi"
  s.dependency "React-runtimeexecutor"

  add_rn_third_party_dependencies(s)
end
