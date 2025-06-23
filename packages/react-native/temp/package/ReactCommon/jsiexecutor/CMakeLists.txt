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
        -O3)

add_library(jsireact
        OBJECT
        jsireact/JSIExecutor.cpp
        jsireact/JSINativeModules.cpp)

target_include_directories(jsireact PUBLIC .)

target_link_libraries(jsireact
        react_cxxreact
        reactperflogger
        folly_runtime
        glog
        jsi)
