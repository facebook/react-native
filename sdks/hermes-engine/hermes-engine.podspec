# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"
require_relative "./hermes-utils.rb"

react_native_path = File.join(__dir__, "..", "..")

# Whether Hermes is built for Release or Debug is determined by the PRODUCTION envvar.
build_type = ENV['PRODUCTION'] == "1" ? :release : :debug

# package.json
package = JSON.parse(File.read(File.join(react_native_path, "package.json")))
version = package['version']

# sdks/.hermesversion
hermestag_file = File.join(react_native_path, "sdks", ".hermesversion")
isInCI = ENV['CI'] == true

# sdks/hermesc/osx-bin/ImportHermesc.cmake
import_hermesc_file=File.join(react_native_path, "sdks", "hermesc", "osx-bin", "ImportHermesc.cmake")

source = {}
git = "https://github.com/facebook/hermes.git"

isInMain = version.include?('1000.0.0')
isNightly = version.start_with?('0.0.0-')

if ENV.has_key?('HERMES_ENGINE_TARBALL_PATH')
  Pod::UI.puts '[Hermes] Using pre-built Hermes binaries from local path.' if Object.const_defined?("Pod::UI")
  source[:http] = "file://#{ENV['HERMES_ENGINE_TARBALL_PATH']}"
elsif isInMain
  Pod::UI.puts '[Hermes] Installing hermes-engine may take a while, building Hermes from source...'.yellow if Object.const_defined?("Pod::UI")
  source[:git] = git
  source[:commit] = `git ls-remote https://github.com/facebook/hermes main | cut -f 1`.strip
elsif isNightly
  Pod::UI.puts '[Hermes] Nightly version, download pre-built for Hermes'.yellow if Object.const_defined?("Pod::UI")
  destination_path = download_nightly_hermes(react_native_path, version)
  # set tarball as hermes engine
  source[:http] = "file://#{destination_path}"
elsif File.exists?(hermestag_file) && isInCI
  Pod::UI.puts '[Hermes] Detected that you are on a React Native release branch, building Hermes from source...'.yellow if Object.const_defined?("Pod::UI")
  hermestag = File.read(hermestag_file).strip
  source[:git] = git
  source[:tag] = hermestag
else
  # Sample url from Maven:
  # https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.71.0/react-native-artifacts-0.71.0-hermes-ios-debug.tar.gz
  source[:http] = "https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/#{version}/react-native-artifacts-#{version}-hermes-ios-#{build_type.to_s}.tar.gz"
end

Pod::Spec.new do |spec|
  spec.name        = "hermes-engine"
  spec.version     = version
  spec.summary     = "Hermes is a small and lightweight JavaScript engine optimized for running React Native."
  spec.description = "Hermes is a JavaScript engine optimized for fast start-up of React Native apps. It features ahead-of-time static optimization and compact bytecode."
  spec.homepage    = "https://hermesengine.dev"
  spec.license     = package['license']
  spec.author      = "Facebook"
  spec.source      = source
  spec.platforms   = { :osx => "10.13", :ios => "12.4" }

  spec.preserve_paths      = ["destroot/bin/*"].concat(build_type == :debug ? ["**/*.{h,c,cpp}"] : [])
  spec.source_files        = "destroot/include/**/*.h"
  spec.exclude_files       = [
                               "destroot/include/jsi/jsi/JSIDynamic.{h,cpp}",
                               "destroot/include/jsi/jsi/jsilib-*.{h,cpp}",
                             ]
  spec.header_mappings_dir = "destroot/include"

  spec.ios.vendored_frameworks = "destroot/Library/Frameworks/universal/hermes.xcframework"
  spec.osx.vendored_frameworks = "destroot/Library/Frameworks/macosx/hermes.framework"

  spec.xcconfig = {
                    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
                    "CLANG_CXX_LIBRARY" => "compiler-default"
                  }.merge!(build_type == :debug ? { "GCC_PREPROCESSOR_DEFINITIONS" => "HERMES_ENABLE_DEBUGGER=1" } : {})

  if source[:git] then
    ENV['REACT_NATIVE_PATH'] = react_native_path
    hermes_utils_path = "/sdks/hermes-engine/utils"

    spec.prepare_command = <<-EOS
    export BUILD_TYPE=#{build_type.to_s.capitalize}
    export RELEASE_VERSION="#{version}"
    export IOS_DEPLOYMENT_TARGET="#{spec.deployment_target('ios')}"
    export MAC_DEPLOYMENT_TARGET="#{spec.deployment_target('osx')}"
    export JSI_PATH="$REACT_NATIVE_PATH/ReactCommon/jsi"

    # Set HERMES_OVERRIDE_HERMESC_PATH if pre-built HermesC is available
    #{File.exist?(import_hermesc_file) ? "export HERMES_OVERRIDE_HERMESC_PATH=#{import_hermesc_file}" : ""}
    #{File.exist?(import_hermesc_file) ? "echo \"Overriding HermesC path...\"" : ""}

    # Build iOS framework
    $REACT_NATIVE_PATH#{hermes_utils_path}/build-ios-framework.sh

    # Build Mac framework
    $REACT_NATIVE_PATH#{hermes_utils_path}/build-mac-framework.sh
    EOS
  end
end
