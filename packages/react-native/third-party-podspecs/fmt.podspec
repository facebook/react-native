# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

Pod::Spec.new do |spec|
  spec.name = "fmt"
  spec.version = "9.1.0"
  spec.license = { :type => "MIT" }
  spec.homepage = "https://github.com/fmtlib/fmt"
  spec.summary = "{fmt} is an open-source formatting library for C++. It can be used as a safe and fast alternative to (s)printf and iostreams."
  spec.authors = "The fmt contributors"
  spec.source = {
    :git => "https://github.com/fmtlib/fmt.git",
    :tag => "9.1.0"
  }
  spec.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
  }
  spec.platforms = min_supported_versions
  spec.libraries = "c++"
  spec.public_header_files = "include/fmt/*.h"
  spec.header_mappings_dir = "include"
  spec.source_files = ["include/fmt/*.h", "src/format.cc"]
end
