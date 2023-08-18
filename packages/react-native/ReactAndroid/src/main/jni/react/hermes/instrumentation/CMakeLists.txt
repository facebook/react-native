# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB_RECURSE jsijniprofiler_SRC CONFIGURE_DEPENDS *.cpp)

add_library(
        jsijniprofiler
        SHARED
        ${jsijniprofiler_SRC}
)
target_compile_options(
        jsijniprofiler
        PRIVATE
        -fexceptions
)
target_include_directories(jsijniprofiler PRIVATE .)
target_link_libraries(
      jsijniprofiler
      fb
      fbjni
      jsireact
      folly_runtime
      hermes-engine::libhermes
      jsi
      reactnativejni
)
