# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "../package.json")))

Pod::Spec.new do |s|
  s.name            = "ScreenshotManager"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = "ScreenshotManager"
  s.homepage        = "https://github.com/facebook/react-native.git"
  s.license         = "MIT"
  s.platforms       = min_supported_versions
  s.compiler_flags  = '-Wno-nullability-completeness'
  s.author          = "Meta Platforms, Inc. and its affiliates"
  s.source          = { :git => "https://github.com/facebook/react-native.git", :tag => "#{s.version}" }

  s.source_files    = "**/*.{h,m,mm,swift}"
  s.requires_arc    = true
  s.framework = ["UIKit", "CoreGraphics"]

  install_modules_dependencies(s)
end
