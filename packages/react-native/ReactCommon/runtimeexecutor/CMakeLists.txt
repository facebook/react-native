# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB_RECURSE runtimeexecutor_SRC CONFIGURE_DEPENDS *.cpp *.h)

add_library(runtimeexecutor OBJECT ${runtimeexecutor_SRC})

target_include_directories(runtimeexecutor PUBLIC .)

target_link_libraries(runtimeexecutor jsi)
target_compile_reactnative_options(runtimeexecutor PRIVATE)
target_compile_options(runtimeexecutor PRIVATE -Wpedantic)
