# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"
require "open3"

# sdks/hermesc/osx-bin/ImportHermesc.cmake
import_hermesc_file=File.join(__dir__, "..", "hermesc", "osx-bin", "ImportHermesc.cmake")

# package.json
package_file = File.join(__dir__, "..", "..", "package.json")
package = JSON.parse(File.read(package_file))
version = package['version']

# We need to check the current git branch/remote to verify if
# we're on a React Native release branch to actually build Hermes.
currentbranch, err = Open3.capture3("git rev-parse --abbrev-ref HEAD")
currentremote, err = Open3.capture3("git config --get remote.origin.url")

source = {}
git = "https://github.com/facebook/hermes.git"

if ENV.has_key?('HERMES_ENGINE_TARBALL_PATH')
  Pod::UI.puts '[Hermes] Using pre-built Hermes binaries from local path.' if Object.const_defined?("Pod::UI")
  source[:http] = "file://#{ENV['HERMES_ENGINE_TARBALL_PATH']}"
elsif version == '1000.0.0'
  Pod::UI.puts '[Hermes] Hermes needs to be compiled, installing hermes-engine may take a while...'.yellow if Object.const_defined?("Pod::UI")
  source[:git] = git
  source[:commit] = `git ls-remote https://github.com/facebook/hermes main | cut -f 1`.strip
elsif currentremote.strip.end_with?("facebook/react-native.git") and currentbranch.strip.end_with?("-stable")
  Pod::UI.puts '[Hermes] Detected that you are on a React Native release branch, building Hermes from source...'.yellow if Object.const_defined?("Pod::UI")
  source[:git] = git
  source[:commit] = `git ls-remote https://github.com/facebook/hermes main | cut -f 1`.strip
else
  source[:http] = "https://github.com/facebook/react-native/releases/download/v#{version}/hermes-runtime-darwin-v#{version}.tar.gz"
end

module HermesHelper
  # BUILD_TYPE = :debug
  BUILD_TYPE = :release
end

Pod::Spec.new do |spec|
  spec.name        = "hermes-engine"
  spec.version     = version
  spec.summary     = "Hermes is a small and lightweight JavaScript engine optimized for running React Native."
  spec.description = "Hermes is a JavaScript engine optimized for fast start-up of React Native apps. It features ahead-of-time static optimization and compact bytecode."
  spec.homepage    = "https://hermesengine.dev"
  spec.license     = package["license"]
  spec.author      = "Facebook"
  spec.source      = source
  spec.platforms   = { :osx => "10.13", :ios => "12.4" }

  spec.preserve_paths      = ["destroot/bin/*"].concat(HermesHelper::BUILD_TYPE == :debug ? ["**/*.{h,c,cpp}"] : [])
  spec.source_files        = "destroot/include/**/*.h"
  spec.header_mappings_dir = "destroot/include"

  spec.ios.vendored_frameworks = "destroot/Library/Frameworks/universal/hermes.xcframework"
  spec.osx.vendored_frameworks = "destroot/Library/Frameworks/macosx/hermes.framework"

  spec.xcconfig            = { "CLANG_CXX_LANGUAGE_STANDARD" => "c++17", "CLANG_CXX_LIBRARY" => "compiler-default", "GCC_PREPROCESSOR_DEFINITIONS" => "HERMES_ENABLE_DEBUGGER=1" }

  if source[:git] then
    spec.prepare_command = <<-EOS
      # When true, debug build will be used.
      # See `build-apple-framework.sh` for details
      DEBUG=#{HermesHelper::BUILD_TYPE == :debug}

      # Set HERMES_OVERRIDE_HERMESC_PATH if pre-built HermesC is available
      #{File.exist?(import_hermesc_file) ? "export HERMES_OVERRIDE_HERMESC_PATH=#{import_hermesc_file}" : ""}
      #{File.exist?(import_hermesc_file) ? "echo \"Overriding HermesC path...\"" : ""}

      # Build iOS framework
      ./utils/build-ios-framework.sh

      # Build Mac framework
      ./utils/build-mac-framework.sh
    EOS
  end
end
