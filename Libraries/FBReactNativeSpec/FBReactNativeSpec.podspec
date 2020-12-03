# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
codegen_path_prefix = ".."
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip
  codegen_path_prefix = "packages"
else
  source[:tag] = "v#{version}"
end

react_native_path = File.join(__dir__, "..", "..")
srcs_dir = File.join(__dir__, "..")
codegen_script_path = File.join(react_native_path, "scripts", "generate-native-modules-specs.sh")
codegen_path = File.join(react_native_path, codegen_path_prefix, "react-native-codegen")
output_dir = File.join(__dir__, "FBReactNativeSpec")
generated_files = [File.join(output_dir, "FBReactNativeSpec.h"), File.join(output_dir, "FBReactNativeSpec-generated.mm")]
codegen_command = "CODEGEN_PATH=#{codegen_path} sh '#{codegen_script_path}' | tee \"${SCRIPT_OUTPUT_FILE_0}\""

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2020.01.13.00'

Pod::Spec.new do |s|
  s.name                   = "FBReactNativeSpec"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "10.0" }
  s.compiler_flags         = folly_compiler_flags + ' -Wno-nullability-completeness'
  s.source                 = source
  s.source_files           = "**/*.{c,h,m,mm,cpp}"
  s.header_dir             = "FBReactNativeSpec"

  s.pod_target_xcconfig    = {
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/Libraries/FBReactNativeSpec\" \"$(PODS_ROOT)/RCT-Folly\""
                             }

  s.dependency "RCT-Folly", folly_version
  s.dependency "RCTRequired", version
  s.dependency "RCTTypeSafety", version
  s.dependency "React-Core", version
  s.dependency "React-jsi", version
  s.dependency "ReactCommon/turbomodule/core", version

  s.prepare_command = "mkdir -p #{output_dir} && touch #{generated_files.reduce() { |str, file| str + " " + file }}"
  s.script_phase = {
    :name => 'Generate Native Modules Code',
    :input_files => [srcs_dir],
    :output_files => ["$(DERIVED_FILE_DIR)/FBReactNativeSpec-codegen.log"],
    :script => codegen_command,
    :execution_position => :before_compile
  }
end
