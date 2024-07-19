# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name            = 'OSSLibraryExample'
  s.version         = package['version']
  s.summary         = package['description']
  s.description     = package['description']
  s.homepage        = package['homepage']
  s.license         = package['license']
  s.platforms       = min_supported_versions
  s.author          = 'Meta Platforms, Inc. and its affiliates'
  s.source          = { :git => package['repository']['url'], :tag => "#{s.version}" }

  s.source_files = 'ios/**/*.{h,m,mm,cpp}'

  install_modules_dependencies(s)
end
