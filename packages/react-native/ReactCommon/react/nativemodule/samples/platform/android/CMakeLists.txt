# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB sampleturbomodule_SRC CONFIGURE_DEPENDS ReactCommon/*.cpp)
add_library(sampleturbomodule STATIC ${sampleturbomodule_SRC})

target_include_directories(sampleturbomodule PUBLIC .)

target_link_libraries(sampleturbomodule
        fbjni
        jsi
        reactnative
)

target_compile_reactnative_options(sampleturbomodule PRIVATE "ReactNative")
target_compile_options(sampleturbomodule PRIVATE -Wpedantic)
