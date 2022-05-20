# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']

source = ENV['hermes-artifact-url'] ? { http: ENV['hermes-artifact-url'] } : { git: "https://github.com/facebook/hermes.git" }
hermes_tag_file = File.join(__dir__, ".hermesversion")
if (File.exist?(hermes_tag_file))
  # This is a published version, use the tag associated with this release
  source[:tag] = File.read(hermes_tag_file) unless ENV['hermes-artifact-url']
else
  # This is an unpublished version, use the latest commit hash of the hermes repo
  hermes_commit_sha = `git ls-remote https://github.com/facebook/hermes main | cut -f 1`.strip
  source[:commit] = hermes_commit_sha unless ENV['hermes-artifact-url']
end

module HermesHelper
  # BUILD_TYPE = :debug
  BUILD_TYPE = :release
end

Pod::UI.puts '[Hermes] Hermes needs to be compiled, installing hermes-engine may take a while...'.yellow if Object.const_defined?("Pod::UI")

import_hermesc_path=File.join(__dir__, "../hermesc/osx-bin/ImportHermesc.cmake")

Pod::Spec.new do |spec|
  spec.name        = "hermes-engine"
  spec.version     = version
  spec.summary     = "Hermes is a small and lightweight JavaScript engine optimized for running React Native."
  spec.description = "Hermes is a JavaScript engine optimized for fast start-up of React Native apps. It features ahead-of-time static optimization and compact bytecode."
  spec.homepage    = "https://hermesengine.dev"
  spec.license     = { type: "MIT", file: "LICENSE" }
  spec.author      = "Facebook"
  spec.source      = source
  spec.platforms   = { :osx => "10.13", :ios => "11.0" }

  spec.preserve_paths      = ["destroot/bin/*"].concat(HermesHelper::BUILD_TYPE == :debug ? ["**/*.{h,c,cpp}"] : [])
  spec.source_files        = "destroot/include/**/*.h"
  spec.header_mappings_dir = "destroot/include"

  spec.ios.vendored_frameworks = "destroot/Library/Frameworks/universal/hermes.xcframework"
  spec.osx.vendored_frameworks = "destroot/Library/Frameworks/macosx/hermes.framework"

  spec.xcconfig            = { "CLANG_CXX_LANGUAGE_STANDARD" => "c++17", "CLANG_CXX_LIBRARY" => "compiler-default", "GCC_PREPROCESSOR_DEFINITIONS" => "HERMES_ENABLE_DEBUGGER=1" }

  unless ENV['hermes-artifact-url']
    spec.prepare_command = <<-EOS
      # When true, debug build will be used.
      # See `build-apple-framework.sh` for details
      DEBUG=#{HermesHelper::BUILD_TYPE == :debug}

      # Set HERMES_OVERRIDE_HERMESC_PATH if pre-built HermesC is available
      #{File.exist?(import_hermesc_path) ? "export HERMES_OVERRIDE_HERMESC_PATH=#{import_hermesc_path}" : ""}
      #{File.exist?(import_hermesc_path) ? "echo \"Overriding HermesC path...\"" : ""}

      # Build iOS framework
      ./utils/build-ios-framework.sh

      # Build Mac framework
      ./utils/build-mac-framework.sh
    EOS
  end
end
