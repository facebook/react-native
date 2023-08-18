# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -frtti
        -std=c++17
        -Wall
        -Wpedantic
        -Wno-gnu-zero-variadic-macro-arguments
        -DFOLLY_NO_CONFIG=1
        -DLOG_TAG=\"ReactNative\")

file(GLOB nativecxxmoduleexample_SRC CONFIGURE_DEPENDS *.cpp)
add_library(nativecxxmoduleexample STATIC ${nativecxxmoduleexample_SRC})

target_include_directories(nativecxxmoduleexample PUBLIC .)
target_include_directories(react_codegen_AppSpecs PUBLIC .)

target_link_libraries(nativecxxmoduleexample
        fbjni
        jsi
        react_nativemodule_core
        react_codegen_AppSpecs)
