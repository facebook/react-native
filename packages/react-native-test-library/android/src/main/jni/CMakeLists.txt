# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB react_codegen_SRCS CONFIGURE_DEPENDS *.cpp react/renderer/components/OSSLibraryExampleSpec/*.cpp)

add_library(
  react_codegen_OSSLibraryExampleSpec
  OBJECT
  ${react_codegen_SRCS}
)

target_include_directories(react_codegen_OSSLibraryExampleSpec PUBLIC . react/renderer/components/OSSLibraryExampleSpec)

target_link_libraries(
  react_codegen_OSSLibraryExampleSpec
  fbjni
  jsi
  reactnative
)

target_compile_reactnative_options(react_codegen_OSSLibraryExampleSpec PRIVATE)
