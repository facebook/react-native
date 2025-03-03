# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

#########################
###  cxxreactpackage  ###
#########################

add_library(react_cxxreactpackage INTERFACE)

target_include_directories(react_cxxreactpackage
        INTERFACE
        ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(react_cxxreactpackage
        INTERFACE
        fb
        fbjni)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)
target_compile_reactnative_options(react_cxxreactpackage INTERFACE)
target_compile_options(react_cxxreactpackage INTERFACE -Wno-unused-lambda-capture)
