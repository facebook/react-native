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

react_native_path = ".."

Pod::Spec.new do |s|
  s.name                   = "React-jserrorhandler"
  s.version                = version
  s.summary                = "-"
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.header_dir             = "jserrorhandler"
  s.source_files           = "JsErrorHandler.{cpp,h}", "StackTraceParser.{cpp,h}"
  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard()
  }
  if ENV['USE_FRAMEWORKS']
    s.header_mappings_dir     = '../'
    s.module_name             = 'React_jserrorhandler'
  end

  s.dependency "React-jsi"
  s.dependency "React-cxxreact"
  s.dependency "ReactCommon/turbomodule/bridging"
  add_dependency(s, "React-featureflags")
  add_dependency(s, "React-debug")

  if ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == "1"
    s.dependency 'hermes-engine'
  end

  add_rn_third_party_dependencies(s)

end
