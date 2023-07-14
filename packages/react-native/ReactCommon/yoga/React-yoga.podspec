# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

package = JSON.parse(File.read(File.expand_path('../../package.json', __dir__)))
version = package['version']

source = { :git => ENV['INSTALL_YOGA_FROM_LOCATION'] || 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                   = "React-yoga"
  s.version                = version
  s.summary                = "Yoga built for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = { :ios => min_ios_version_supported }
  s.source                 = source

  s.module_name            = 'yoga'
  s.header_dir             = 'yoga'
  s.requires_arc           = false
  s.compiler_flags         = [
                              '-fno-omit-frame-pointer',
                              '-fexceptions',
                              '-Wall',
                              '-Werror',
                              '-std=c++17',
                              '-fPIC',
                             ]

  # Set this environment variable when *not* using the `:path` option to install the pod.
  # E.g. when publishing this spec to a spec repo.
  source_files = 'yoga/**/*.{cpp,h}'
  source_files = File.join('ReactCommon/yoga', source_files) if ENV['INSTALL_YOGA_WITHOUT_PATH_OPTION']
  s.source_files = source_files

  public_header_files = 'yoga/**/*.h'
  public_header_files = File.join('ReactCommon/yoga', public_header_files) if ENV['INSTALL_YOGA_WITHOUT_PATH_OPTION']
  s.public_header_files = public_header_files
end
