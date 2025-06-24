# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
version = package['version']

source = ReactNativeCoreUtils.resolve_podspec_source()

header_search_paths = [
  "${PODS_ROOT}/Headers/Private/React-Core-prebuilt",
  "${PODS_ROOT}/Headers/Private/React-Core-prebuilt/RCTDeprecation",
  "${PODS_ROOT}/Headers/Private/React-Core-prebuilt/ReactCommon/yoga",
  "${PODS_ROOT}/Headers/Private/React-Core-prebuilt/ReactCommon",
  "${PODS_ROOT}/Headers/Private/React-Core-prebuilt/Libraries/AppDelegate",
  "${PODS_ROOT}/Headers/Private/React-Core-prebuilt/Libraries",

  "$(REACT_NATIVE_PATH)/React/Base",
  "$(REACT_NATIVE_PATH)/ReactCommon",
  "$(REACT_NATIVE_PATH)/Libraries",
  "$(REACT_NATIVE_PATH)/ReactApple",
  "$(REACT_NATIVE_PATH)/ReactCxxPlatform",
  "$(REACT_NATIVE_PATH)/ReactCommon/react/runtime/platform/ios",
  "${REACT_NATIVE_PATH}/ReactCommon/jsi",
  "$(REACT_NATIVE_PATH)/ReactCommon/jsiexecutor/",
  "$(REACT_NATIVE_PATH)/ReactCommon/react/nativemodule/samples/platform/ios",
  "$(REACT_NATIVE_PATH)/ReactCommon/react/nativemodule/samples",
]

Pod::Spec.new do |spec|
  spec.name                 = 'React-Core-prebuilt'
  spec.version              = version
  spec.summary              = "Prebuilt core of React Native."
  spec.homepage             = "https://reactnative.dev/"
  spec.description          = 'Prebuilt React Native Core libraries and headers'
  spec.homepage             = 'https://github.com/facebook/react-native'
  spec.license              = package['license']
  spec.authors              = 'meta'
  spec.platforms            = min_supported_versions
  spec.source               = source

  spec.vendored_frameworks  = "React.xcframework"

  spec.preserve_paths       = '**/*.*'
  spec.header_mappings_dir  = 'React.xcframework/Headers'
  spec.source_files         = 'React.xcframework/Headers/**/*.{h,hpp}'

  spec.module_name          = 'React'
  spec.module_map           = 'React.xcframework/Modules/module.modulemap'
  spec.public_header_files  = 'React.xcframework/Headers/**/*.h'

  # Setup the consuming project's search paths
  spec.user_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => header_search_paths,
    "SWIFT_INCLUDE_PATHS" => "${PODS_ROOT}/Headers/Private/React-Core-prebuilt",
    'DEFINES_MODULE' => 'YES',
    'CLANG_ENABLE_MODULES' => 'YES',
  }

  spec.pod_target_xcconfig  = {
    'WARNING_CFLAGS' => '-Wno-comma -Wno-shorten-64-to-32',
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
    'DEFINES_MODULE' => 'YES',
    'CLANG_ENABLE_MODULES' => 'YES',
  }

  # We need to make sure that the React.xcframework is copied correctly - in the downloaded tarball
  # the root directory is the framework, but when using it we need to have it in a subdirectory
  # called React.xcframework, so we need to move the contents of the tarball into that directory.
  # This is done in the prepare_command.
  spec.prepare_command = <<~'CMD'
    CURRENT_PATH=$(pwd)
    XCFRAMEWORK_PATH="${CURRENT_PATH}/React.xcframework"
    mkdir -p "${XCFRAMEWORK_PATH}"
    find "$CURRENT_PATH" -mindepth 1 -maxdepth 1 ! -name "$(basename "$XCFRAMEWORK_PATH")" -exec mv {} "$XCFRAMEWORK_PATH" \;
  CMD

  # If we are passing a local tarball, we don't want to switch between Debug and Release
  if !ENV["RCT_TESTONLY_RNCORE_TARBALL_PATH"]
    script_phase = {
      :name => "[RNDeps] Replace React Native Core for the right configuration, if needed",
      :execution_position => :before_compile,
      :script => <<-EOS
      . "$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"

      CONFIG="Release"
      if echo $GCC_PREPROCESSOR_DEFINITIONS | grep -q "DEBUG=1"; then
        CONFIG="Debug"
      fi

      # TODO(T228219721): Add this for React Native Core as well
      ##### "$NODE_BINARY" "$REACT_NATIVE_PATH/third-party-podspecs/replace_dependencies_version.js" -c "$CONFIG" -r "#{version}" -p "$PODS_ROOT"
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
