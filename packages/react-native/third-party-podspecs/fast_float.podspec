# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

fast_float_config = get_fast_float_config()
fast_float_git_url = fast_float_config[:git]

Pod::Spec.new do |spec|
  spec.name = "fast_float"
  spec.version = "8.0.0"
  spec.license = { :type => "MIT" }
  spec.homepage = "https://github.com/fastfloat/fast_float"
  spec.summary = "{fast_float} is an open-source number parsing library for C++. The library provides fast header-only implementations."
  spec.authors = "The fast_float contributors"
  spec.source = {
    :git => fast_float_git_url,
    :tag => "v8.0.0"
  }
  spec.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
    "GCC_WARN_INHIBIT_ALL_WARNINGS" => "YES" # Disable warnings because we don't control this library
  }
  spec.platforms = min_supported_versions
  spec.libraries = "c++"
  spec.public_header_files = "include/fast_float/*.h"
  spec.header_mappings_dir = "include"
  spec.source_files = ["include/fast_float/*.h"]
end
