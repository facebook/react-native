# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"
require_relative "./hermes-utils.rb"

react_native_path = File.join(__dir__, "..", "..")

# Whether Hermes is built for Release or Debug is determined by the PRODUCTION envvar.
build_type = ENV['PRODUCTION'] == "1" ? :release : :debug

# package.json
package = JSON.parse(File.read(File.join(react_native_path, "package.json")))
version = package['version']

# sdks/.hermesversion
hermestag_file = File.join(react_native_path, "sdks", ".hermesversion")
isInCI = ENV['REACT_NATIVE_CI'] === 'true'

source = {}
git = "https://github.com/facebook/hermes.git"

isInMain = version.include?('1000.0.0')
isNightly = version.start_with?('0.0.0-')

if ENV.has_key?('HERMES_ENGINE_TARBALL_PATH')
  if !File.exist?(ENV['HERMES_ENGINE_TARBALL_PATH'])
    abort "[Hermes] HERMES_ENGINE_TARBALL_PATH is set, but points to a non-existing file: \"#{ENV['HERMES_ENGINE_TARBALL_PATH']}\"\nIf you don't want to use tarball, run `unset HERMES_ENGINE_TARBALL_PATH`"
  end
end

if ENV.has_key?('HERMES_ENGINE_TARBALL_PATH')
  Pod::UI.puts "[Hermes] Using pre-built Hermes binaries from local path: #{ENV['HERMES_ENGINE_TARBALL_PATH']}".yellow if Object.const_defined?("Pod::UI")
  source[:http] = "file://#{ENV['HERMES_ENGINE_TARBALL_PATH']}"
elsif isInMain
  Pod::UI.puts '[Hermes] Installing hermes-engine may take slightly longer, building Hermes compiler from source...'.yellow if Object.const_defined?("Pod::UI")
  source[:git] = git
  source[:commit] = `git ls-remote https://github.com/facebook/hermes main | cut -f 1`.strip
elsif isNightly
  Pod::UI.puts '[Hermes] Nightly version, download pre-built for Hermes'.yellow if Object.const_defined?("Pod::UI")
  destination_path = download_nightly_hermes(react_native_path, version)
  # set tarball as hermes engine
  source[:http] = "file://#{destination_path}"
elsif File.exists?(hermestag_file) && isInCI
  Pod::UI.puts '[Hermes] Detected that you are on a React Native release branch, building Hermes from source but fetched from tag...'.yellow if Object.const_defined?("Pod::UI")
  hermestag = File.read(hermestag_file).strip
  source[:git] = git
  source[:tag] = hermestag
else
  # Sample url from Maven:
  # https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.71.0/react-native-artifacts-0.71.0-hermes-ios-debug.tar.gz
  source[:http] = "https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/#{version}/react-native-artifacts-#{version}-hermes-ios-#{build_type.to_s}.tar.gz"
end

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

  spec.preserve_paths      = '**/*.*'
  spec.source_files        = ''

  spec.xcconfig = {
                    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
                    "CLANG_CXX_LIBRARY" => "compiler-default"
                  }.merge!(build_type == :debug ? { "GCC_PREPROCESSOR_DEFINITIONS" => "HERMES_ENABLE_DEBUGGER=1" } : {})

  if source[:http] then

    spec.subspec 'Pre-built' do |ss|
      ss.preserve_paths = ["destroot/bin/*"].concat(build_type == :debug ? ["**/*.{h,c,cpp}"] : [])
      ss.source_files = "destroot/include/**/*.h"
      ss.exclude_files = ["destroot/include/jsi/jsi/JSIDynamic.{h,cpp}", "destroot/include/jsi/jsi/jsilib-*.{h,cpp}"]
      ss.header_mappings_dir = "destroot/include"
      ss.ios.vendored_frameworks = "destroot/Library/Frameworks/universal/hermes.xcframework"
      ss.osx.vendored_frameworks = "destroot/Library/Frameworks/macosx/hermes.framework"
    end

  elsif source[:git] then

    spec.subspec 'Hermes' do |ss|
      ss.source_files = ''
      ss.public_header_files = 'API/hermes/*.h'
      ss.header_dir = 'hermes'
    end

    spec.subspec 'JSI' do |ss|
      ss.source_files = ''
      ss.public_header_files = 'API/jsi/jsi/*.h'
      ss.header_dir = 'jsi'
    end

    spec.subspec 'Public' do |ss|
      ss.source_files = ''
      ss.public_header_files = 'public/hermes/Public/*.h'
      ss.header_dir = 'hermes/Public'
    end

    hermesc_path = ""

    if ENV.has_key?('HERMES_OVERRIDE_HERMESC_PATH') && File.exist?(ENV['HERMES_OVERRIDE_HERMESC_PATH']) then
      hermesc_path = ENV['HERMES_OVERRIDE_HERMESC_PATH']
    else
      # Keep hermesc_path synchronized with .gitignore entry.
      ENV['REACT_NATIVE_PATH'] = react_native_path
      hermesc_path = "${REACT_NATIVE_PATH}/sdks/hermes-engine/build_host_hermesc"
      # NOTE: Prepare command is not run  if the pod is not downloaded.
      spec.prepare_command = ". #{react_native_path}/sdks/hermes-engine/utils/build-hermesc-xcode.sh #{hermesc_path}"
    end

    spec.user_target_xcconfig = {
      'FRAMEWORK_SEARCH_PATHS' => '"$(PODS_ROOT)/hermes-engine/destroot/Library/Frameworks/iphoneos" ' +
                                  '"$(PODS_ROOT)/hermes-engine/destroot/Library/Frameworks/iphonesimulator" ' +
                                  '"$(PODS_ROOT)/hermes-engine/destroot/Library/Frameworks/macosx" ' +
                                  '"$(PODS_ROOT)/hermes-engine/destroot/Library/Frameworks/catalyst"',
      'OTHER_LDFLAGS' => '-framework "hermes"',
      'HERMES_CLI_PATH' => "#{hermesc_path}/bin/hermesc"
    }

    spec.script_phases = [
      {
        :name => 'Build Hermes',
        :script => <<-EOS
        . ${PODS_ROOT}/../.xcode.env
        export CMAKE_BINARY=${CMAKE_BINARY:-#{%x(command -v cmake | tr -d '\n')}}
        . ${REACT_NATIVE_PATH}/sdks/hermes-engine/utils/build-hermes-xcode.sh #{version} #{hermesc_path}/ImportHermesc.cmake
        EOS
      },
      {
        :name => 'Copy Hermes Framework',
        :script => ". ${REACT_NATIVE_PATH}/sdks/hermes-engine/utils/copy-hermes-xcode.sh"
      }
    ]
  end
end
