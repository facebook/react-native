# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"
require_relative "./ReactNativeDependencies-utils.rb"

begin
  react_native_path = File.dirname(Pod::Executable.execute_command('node', ['-p',
    'require.resolve(
    "react-native",
    {paths: [process.argv[1]]},
    )', __dir__]).strip
  )
rescue => e
  # Fallback to the parent directory if the above command fails (e.g when building locally in OOT Platform)
  react_native_path = File.join(__dir__, "..", "..")
end

# package.json
package = JSON.parse(File.read(File.join(react_native_path, "package.json")))
version = package['version']

source_type = rndeps_source_type("0.79.0-rc.0", react_native_path)
source = podspec_source(source_type, "0.79.0-rc.0", react_native_path)

Pod::Spec.new do |spec|
  spec.name                 = 'ReactNativeDependencies'
  spec.version              = version
  spec.summary              = 'React Native Dependencies'
  spec.description          = 'ReactNativeDependencies is a podspec that contains all the third-party dependencies of React Native.'
  spec.homepage             = 'https://github.com/facebook/react-native'
  spec.license              = package['license']
  spec.authors              = 'meta'
  spec.source               = source
  spec.preserve_paths       = '**/*.*'
  spec.vendored_frameworks  = 'react-native/third-party/ReactNativeDependencies.xcframework'
  spec.source_files         = 'Headers/**/*.{h,hpp}'
  spec.header_mappings_dir  = 'Headers'
  spec.prepare_command      = 'mkdir -p Headers && rsync -a react-native/third-party/ReactNativeDependencies.xcframework/ios-arm64/ReactNativeDependencies.framework/Headers/ Headers'
  spec.platforms            = min_supported_versions
  spec.user_target_xcconfig = {
    'WARNING_CFLAGS' => '-Wno-everything -Wno-comma -Wno-shorten-64-to-32',
  }
end