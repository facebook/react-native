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

source_type = rndeps_source_type(version, react_native_path)
source = podspec_source(source_type, version, react_native_path)

Pod::Spec.new do |spec|
  spec.name                 = 'ReactNativeDependencies'
  spec.version              = version
  spec.summary              = 'React Native Dependencies'
  spec.description          = 'ReactNativeDependencies is a podspec that contains all the third-party dependencies of React Native.'
  spec.homepage             = 'https://github.com/facebook/react-native'
  spec.license              = package['license']
  spec.authors              = 'meta'
  spec.source               = source
  spec.source_files         = ''
  spec.prepare_command = <<-CMD
    mkdir -p Headers
    rsync -a react-native/third-party/ReactNativeDependencies.xcframework/ios-arm64/ReactNativeDependencies.framework/Headers/ Headers
    mkdir -p framework/packages/react-native
    rsync -a --remove-source-files react-native/ framework/packages/react-native/
    find react-native/ -type d -empty -delete

  CMD
  spec.platforms            = min_supported_versions
  spec.user_target_xcconfig = {
    'WARNING_CFLAGS' => '-Wno-everything -Wno-comma -Wno-shorten-64-to-32',
  }

  if source_type == ReactNativeDepsSourceType::DOWNLOAD_PREBUILD_RELEASE_TARBALL
      spec.subspec 'Pre-built' do |ss|
        ss.preserve_paths       = '**/*.*'
        ss.vendored_frameworks  = 'framework/packages/react-native/third-party/ReactNativeDependencies.xcframework'
        ss.header_mappings_dir  = 'Headers'
        ss.source_files = 'Headers/**/*.{h,hpp}'
      end

      script_phase = {
        :name => "[RNDeps] Replace React Native Dependencies for the right configuration, if needed",
        :execution_position => :before_compile,
        :script => <<-EOS
        . "$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"

        CONFIG="Release"
        if echo $GCC_PREPROCESSOR_DEFINITIONS | grep -q "DEBUG=1"; then
          CONFIG="Debug"
        fi

        "$NODE_BINARY" "$REACT_NATIVE_PATH/third-party-podspecs/replace_dependencies_version.js" -c "$CONFIG" -r "#{version}" -p "$PODS_ROOT"
        EOS
      }

      # :always_out_of_date is only available in CocoaPods 1.13.0 and later
      if Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.13.0')
        # always run the script without warning
        script_phase[:always_out_of_date] = "1"
      end

      spec.script_phase = script_phase
  end

end