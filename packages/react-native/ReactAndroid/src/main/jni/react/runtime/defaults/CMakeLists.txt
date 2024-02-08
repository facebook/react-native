# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -frtti
        -Wno-unused-lambda-capture
        -std=c++20)


######################
### react_defaults ###
######################

add_library(react_defaults SHARED ReactCommon/OnLoad.cpp ReactCommon/DefaultTurboModuleManagerDelegate.cpp)

target_include_directories(react_defaults
        PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(react_defaults
        fb
        turbomodulejsijni
        react_nativemodule_core
        react_codegen_rncore
        react_cxxreactpackage
        glog
        glog_init
        fbjni)
