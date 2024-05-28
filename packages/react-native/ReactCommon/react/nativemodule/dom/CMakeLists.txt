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
        -DLOG_TAG=\"ReactNative\")

file(GLOB react_nativemodule_dom_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_nativemodule_dom SHARED ${react_nativemodule_dom_SRC})

target_include_directories(react_nativemodule_dom PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_nativemodule_dom
        rrc_root
        react_codegen_rncore
        react_cxxreact
        react_render_dom
        react_render_uimanager
)
