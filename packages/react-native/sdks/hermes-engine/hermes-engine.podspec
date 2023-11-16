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

source_type = hermes_source_type(version, react_native_path)
source = podspec_source(source_type, version, react_native_path)

Pod::Spec.new do |spec|
  spec.name        = "hermes-engine"
  spec.version     = version
  spec.summary     = "Hermes is a small and lightweight JavaScript engine optimized for running React Native."
  spec.description = "Hermes is a JavaScript engine optimized for fast start-up of React Native apps. It features ahead-of-time static optimization and compact bytecode."
  spec.homepage    = "https://hermesengine.dev"
  spec.license     = package['license']
  spec.author      = "Facebook"
  spec.source      = source
  spec.platforms   = { :osx => "10.13", :ios => "13.4" }

  spec.preserve_paths      = '**/*.*'
  spec.source_files        = ''

  spec.pod_target_xcconfig = {
                    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
                    "CLANG_CXX_LIBRARY" => "compiler-default"
                  }

  spec.ios.vendored_frameworks = "destroot/Library/Frameworks/ios/hermes.framework"
  spec.osx.vendored_frameworks = "destroot/Library/Frameworks/macosx/hermes.framework"

  if HermesEngineSourceType::isPrebuilt(source_type) then

    spec.subspec 'Pre-built' do |ss|
      ss.preserve_paths = ["destroot/bin/*"].concat(["**/*.{h,c,cpp}"])
      ss.source_files = "destroot/include/hermes/**/*.h"
      ss.header_mappings_dir = "destroot/include"
      ss.ios.vendored_frameworks = "destroot/Library/Frameworks/universal/hermes.xcframework"
      ss.osx.vendored_frameworks = "destroot/Library/Frameworks/macosx/hermes.framework"
    end


    # Right now, even reinstalling pods with the PRODUCTION flag turned on, does not change the version of hermes that is downloaded
    # To remove the PRODUCTION flag, we want to download the right version of hermes on the flight
    # we do so in a pre-build script we invoke from the Xcode build pipeline
    # We use this only for Apps created using the template. RNTester and Nightlies should not be used to build for Release.
    # We ignore this if we provide a specific tarball: the assumption here is that if you are providing a tarball, is because you want to
    # test something specific for that tarball.
    if source_type == HermesEngineSourceType::DOWNLOAD_PREBUILD_RELEASE_TARBALL
      spec.script_phase = {
        :name => "[Hermes] Replace Hermes for the right configuration, if needed",
        :execution_position => :before_compile,
        :script => <<-EOS
        . "$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"

        CONFIG="Release"
        if echo $GCC_PREPROCESSOR_DEFINITIONS | grep -q "DEBUG=1"; then
          CONFIG="Debug"
        fi

        "$NODE_BINARY" "$REACT_NATIVE_PATH/sdks/hermes-engine/utils/replace_hermes_version.js" -c "$CONFIG" -r "#{version}" -p "$PODS_ROOT"
        EOS
      }
    end

  elsif HermesEngineSourceType::isFromSource(source_type) then

    spec.subspec 'Hermes' do |ss|
      ss.source_files = ''
      ss.public_header_files = 'API/hermes/*.h'
      ss.header_dir = 'hermes'
    end

    spec.subspec 'inspector' do |ss|
      ss.source_files = ''
      ss.public_header_files = 'API/hermes/inspector/*.h'
      ss.header_dir = 'hermes/inspector'
    end

    spec.subspec 'inspector_chrome' do |ss|
      ss.source_files = ''
      ss.public_header_files = 'API/hermes/inspector/chrome/*.h'
      ss.header_dir = 'hermes/inspector/chrome'
    end

    spec.subspec 'Public' do |ss|
      ss.source_files = ''
      ss.public_header_files = 'public/hermes/Public/*.h'
      ss.header_dir = 'hermes/Public'
    end

    hermesc_path = "${PODS_ROOT}/hermes-engine/build_host_hermesc"

    if ENV.has_key?('HERMES_OVERRIDE_HERMESC_PATH') && File.exist?(ENV['HERMES_OVERRIDE_HERMESC_PATH']) then
      hermesc_path = ENV['HERMES_OVERRIDE_HERMESC_PATH']
    end

    spec.user_target_xcconfig = {
      'HERMES_CLI_PATH' => "#{hermesc_path}/bin/hermesc"
    }

    spec.prepare_command = ". #{react_native_path}/sdks/hermes-engine/utils/create-dummy-hermes-xcframework.sh"

    # This podspec is also run in CI to build Hermes without using Pod install
    # and sometimes CI fails because `Pod::Executable` does not exist if it is not run with Pod Install.
    if defined?(Pod::Executable.to_s)
      puts "Const Defined!"
      CMAKE_BINARY = Pod::Executable::which!('cmake')
      # NOTE: Script phases are sorted alphabetically inside Xcode project
      spec.script_phases = [
        {
          :name => '[RN] [1] Build Hermesc',
          :output_files => [
            "#{hermesc_path}/ImportHermesc.cmake"
          ],
          :script => <<-EOS
          . "${REACT_NATIVE_PATH}/scripts/xcode/with-environment.sh"
          export CMAKE_BINARY=${CMAKE_BINARY:-#{CMAKE_BINARY}}
          . ${REACT_NATIVE_PATH}/sdks/hermes-engine/utils/build-hermesc-xcode.sh #{hermesc_path} ${REACT_NATIVE_PATH}/ReactCommon/jsi
          EOS
        },
        {
          :name => '[RN] [2] Build Hermes',
          :input_files => ["#{hermesc_path}/ImportHermesc.cmake"],
          :output_files => [
            "${PODS_ROOT}/hermes-engine/build/iphonesimulator/API/hermes/hermes.framework/hermes"
          ],
          :script => <<-EOS
          . "${REACT_NATIVE_PATH}/scripts/xcode/with-environment.sh"
          export CMAKE_BINARY=${CMAKE_BINARY:-#{CMAKE_BINARY}}
          . ${REACT_NATIVE_PATH}/sdks/hermes-engine/utils/build-hermes-xcode.sh #{version} #{hermesc_path}/ImportHermesc.cmake ${REACT_NATIVE_PATH}/ReactCommon/jsi
          EOS
        }
      ]
    end
  end
end
