# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

js_engine = ENV['USE_HERMES'] == "0" ?
  :jsc :
  :hermes

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
  s.name                   = "React-jsi"
  s.version                = version
  s.summary                = "JavaScript Interface layer for React Native"
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.source                 = source

  if js_engine == :jsc
    s.source_files  = "**/*.{cpp,h}"
    s.exclude_files = [
                        "jsi/JSIDynamic.{h,cpp}",
                        "jsi/jsilib-posix.cpp",
                        "jsi/jsilib-windows.cpp",
                        "**/test/*"
                      ]
    s.header_dir    = "jsi"
  elsif js_engine == :hermes
    # JSI is provided by hermes-engine when Hermes is enabled
    s.source_files = ""
    s.dependency "hermes-engine"
  end
end
