# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"ReactNative\")

file(GLOB react_newarchdefaults_SRC CONFIGURE_DEPENDS *.cpp)

add_library(react_newarchdefaults SHARED ${react_newarchdefaults_SRC})

target_include_directories(react_newarchdefaults PUBLIC .)

target_link_libraries(react_newarchdefaults
        fbjni
        fabricjni
        react_nativemodule_core
        react_codegen_rncore
        jsi)
