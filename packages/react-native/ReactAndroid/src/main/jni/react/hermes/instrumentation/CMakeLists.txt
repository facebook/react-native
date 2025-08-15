# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB_RECURSE jsijniprofiler_SRC CONFIGURE_DEPENDS *.cpp)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

add_library(
        jsijniprofiler
        OBJECT
        ${jsijniprofiler_SRC}
)
target_compile_reactnative_options(jsijniprofiler PRIVATE)
target_merge_so(jsijniprofiler)

target_include_directories(jsijniprofiler PRIVATE .)

target_link_libraries(
      jsijniprofiler
      hermes-engine::libhermes
      jsi
      reactnative
)
