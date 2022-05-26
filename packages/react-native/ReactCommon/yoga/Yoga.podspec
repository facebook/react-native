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

Pod::Spec.new do |spec|
  spec.name = 'Yoga'
  spec.version = '1.14.0'
  spec.license =  { :type => 'MIT' }
  spec.homepage = 'https://yogalayout.com'
  spec.documentation_url = 'https://yogalayout.com/docs/'

  spec.summary = 'Yoga is a cross-platform layout engine which implements Flexbox.'
  spec.description = 'Yoga is a cross-platform layout engine enabling maximum collaboration within your team by implementing an API many designers are familiar with, and opening it up to developers across different platforms.'

  spec.authors = 'Facebook'
  spec.source = source

  spec.module_name = 'yoga'
  spec.header_dir = 'yoga'
  spec.requires_arc = false
  spec.pod_target_xcconfig = {
      'DEFINES_MODULE' => 'YES'
  }
  spec.compiler_flags = [
      '-fno-omit-frame-pointer',
      '-fexceptions',
      '-Wall',
      '-Werror',
      '-std=c++17',
      '-fPIC'
  ]

  # Pinning to the same version as React.podspec.
  spec.platforms = { :ios => "12.4" }

  # Set this environment variable when *not* using the `:path` option to install the pod.
  # E.g. when publishing this spec to a spec repo.
  source_files = 'yoga/**/*.{cpp,h}', 'Yoga-umbrella.h'
  source_files = source_files.map { |file| File.join('ReactCommon/yoga', file) } if ENV['INSTALL_YOGA_WITHOUT_PATH_OPTION']
  spec.source_files = source_files

  spec.module_map = 'Yoga.modulemap'

  # CocoaPods custom `module_map` + `header_dir` doesn't put the umbrella header in right place.
  # Ideally, modulemap should be placed with the umbrella header, that would work for both use_frameworks! mode and non use_frameworks! mode.
  # This script copy the umbrella header back to right place.
  spec.script_phase = {
    :name => 'Copy umbrella header',
    :input_files => ["$PODS_ROOT/Headers/Public/Yoga/yoga/Yoga-umbrella.h"],
    :output_files => ["$PODS_ROOT/Headers/Private/Yoga/Yoga-umbrella.h"],
    :execution_position => :before_compile,
    :shell_path => '/bin/bash',

    # In use_frameworks! mode, the umbrella header will by copied to right place.
    # This copy command will fail because "$PODS_ROOT/Headers/Public/Yoga/yoga/Yoga-umbrella.h" doesn't exist.
    # The command is just a no-op in use_frameworks! mode.
    :script => 'cp -f "$PODS_ROOT/Headers/Public/Yoga/yoga/Yoga-umbrella.h" "$PODS_ROOT/Headers/Private/Yoga/Yoga-umbrella.h" || true',
  }
end
