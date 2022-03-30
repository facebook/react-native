# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

hermes_tag = 'main'
hermes_tag_file = File.join(__dir__, ".hermesversion")
if (File.exist?(hermes_tag_file))
  hermes_tag = File.read(hermes_tag_file)
end
hermes_tag_sha = `git ls-remote https://github.com/facebook/hermes #{hermes_tag} | cut -f 1`.strip
source = { :git => 'https://github.com/facebook/hermes.git', :commit => hermes_tag_sha }

module HermesHelper
  # BUILD_TYPE = :debug
  BUILD_TYPE = :release
end

Pod::Spec.new do |spec|
  spec.name        = "hermes-engine"
  spec.version     = '1000.0.0'
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

  # TODO: Consider moving Hermes build scripts to react_native_pods.rb for greater control over when they're executed
  spec.prepare_command = <<-EOS
    # When true, debug build will be used.
    # See `build-apple-framework.sh` for details
    DEBUG=#{HermesHelper::BUILD_TYPE == :debug}

    # Build iOS framework
    ./utils/build-ios-framework.sh

    # Build Mac framework
    ./utils/build-mac-framework.sh
  EOS
end
