# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

double_conversion_config = get_double_conversion_config()
double_conversion_git_url = double_conversion_config[:git]

Pod::Spec.new do |spec|
  spec.name = 'DoubleConversion'
  spec.version = '1.1.6'
  spec.license = { :type => 'MIT' }
  spec.homepage = 'https://github.com/google/double-conversion'
  spec.summary = 'Efficient binary-decimal and decimal-binary conversion routines for IEEE doubles'
  spec.authors = 'Google'
  spec.prepare_command = 'mv src double-conversion'
  spec.source = { :git => double_conversion_git_url,
                  :tag => "v#{spec.version}" }
  spec.module_name = 'DoubleConversion'
  spec.header_dir = 'double-conversion'
  spec.source_files = 'double-conversion/*.{h,cc}'
  spec.compiler_flags = '-Wno-unreachable-code'

  spec.user_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/DoubleConversion\"" }

  spec.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "GCC_WARN_INHIBIT_ALL_WARNINGS" => "YES" # Disable warnings because we don't control this library
  }

  # Pinning to the same version as React.podspec.
  spec.platforms = min_supported_versions

end
