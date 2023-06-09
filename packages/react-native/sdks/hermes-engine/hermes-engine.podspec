# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"
require_relative "./hermes-utils.rb"

react_native_path = File.join(__dir__, "..", "..")

# package.json
package = JSON.parse(File.read(File.join(react_native_path, "package.json")))
version = package['version']

# sdks/.hermesversion
hermestag_file = File.join(react_native_path, "sdks", ".hermesversion")
build_from_source = ENV['BUILD_FROM_SOURCE'] === 'true'

git = "https://github.com/facebook/hermes.git"

abort_if_invalid_tarball_provided!

source = compute_hermes_source(build_from_source, hermestag_file, git, version, :release, react_native_path)

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

  spec.preserve_paths      = ["destroot/bin/*"]

  spec.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    "CLANG_CXX_LIBRARY" => "compiler-default"
  }

  spec.dependency "hermes-engine_debug", :configurations => ['Debug']
  spec.dependency "hermes-engine_release", :configurations => ['Release']
end
