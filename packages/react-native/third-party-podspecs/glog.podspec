# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

Pod::Spec.new do |spec|
  spec.name = 'glog'
  spec.version = '0.3.5'
  spec.license = { :type => 'Google', :file => 'COPYING' }
  spec.homepage = 'https://github.com/google/glog'
  spec.summary = 'Google logging module'
  spec.authors = 'Google'

  spec.prepare_command = File.read("../scripts/ios-configure-glog.sh")
  spec.source = { :git => 'https://github.com/google/glog.git',
                  :tag => "v#{spec.version}" }
  spec.module_name = 'glog'
  spec.header_dir = 'glog'
  spec.source_files = 'src/glog/*.h',
                      'src/demangle.cc',
                      'src/logging.cc',
                      'src/raw_logging.cc',
                      'src/signalhandler.cc',
                      'src/symbolize.cc',
                      'src/utilities.cc',
                      'src/vlog_is_on.cc'
  # workaround for https://github.com/facebook/react-native/issues/14326
  spec.preserve_paths = 'src/*.h',
                        'src/base/*.h'
  spec.exclude_files       = "src/windows/**/*"
  spec.compiler_flags      = '-Wno-shorten-64-to-32'

  # TODO: T167482718 Remove this code after April 2024, when Apple will
  # push the lower version of Xcode required to upload apps to the Store.
  xcode_path = `xcodebuild -version` # This return the current version of Xcode

  match = xcode_path.match(/Xcode (\d+)\.(\d+)/)
  major_version = match[1].to_i
  minor_version = match[2].to_i
  is_greater_than_15 = major_version >= 15
  is_greater_than_14_3 = major_version == 14 && minor_version >= 3
  should_define_modules = is_greater_than_15 ? "YES" : is_greater_than_14_3 ? "YES" : "NO"
  # End TODO.

  spec.pod_target_xcconfig = {
    "USE_HEADERMAP" => "NO",
    "HEADER_SEARCH_PATHS" => "$(PODS_TARGET_SRCROOT)/src",
    "DEFINES_MODULE" => should_define_modules # When the workaround is removed, set this var to "YES"
  }

  # Pinning to the same version as React.podspec.
  spec.platforms = min_supported_versions

end
