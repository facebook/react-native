# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)


include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB jscinstance_SRC CONFIGURE_DEPENDS "*.cpp")

add_library(jscinstance OBJECT ${jscinstance_SRC})

target_include_directories(jscinstance PUBLIC .)
target_merge_so(jscinstance)

target_link_libraries(jscinstance
        jscruntime
        fbjni
        reactnative
)
target_compile_reactnative_options(jscinstance PRIVATE)
target_compile_options(jscinstance PRIVATE -fvisibility=hidden)
