# Copyright (c) Facebook, Inc. and its affiliates.
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
  spec.libraries           = "stdc++"
  spec.compiler_flags      = '-Wno-shorten-64-to-32'
  spec.pod_target_xcconfig = { "USE_HEADERMAP" => "NO",
                               "HEADER_SEARCH_PATHS" => "$(PODS_TARGET_SRCROOT)/src" }

  # Pinning to the same version as React.podspec.
  spec.platforms = { :ios => "9.0", :tvos => "9.2" }

end
