# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -frtti
        -std=c++20
        -Wall
        -Wpedantic
        -DFOLLY_NO_CONFIG=1
        -DLOG_TAG=\"ReactNative\")

file(GLOB sampleturbomodule_SRC CONFIGURE_DEPENDS ReactCommon/*.cpp)
add_library(sampleturbomodule STATIC ${sampleturbomodule_SRC})

target_include_directories(sampleturbomodule PUBLIC .)

target_link_libraries(sampleturbomodule
        fbjni
        jsi
        react_nativemodule_core
        turbomodulejsijni)
