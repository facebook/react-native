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
        -DLOG_TAG=\"Fabric\")

file(GLOB rrc_progressbar_SRC CONFIGURE_DEPENDS android/react/renderer/components/progressbar/*.cpp)
add_library(rrc_progressbar OBJECT ${rrc_progressbar_SRC})

target_include_directories(rrc_progressbar
        PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/android/
)

target_link_libraries(rrc_progressbar
        glog
        fbjni
        folly_runtime
        glog_init
        react_codegen_rncore
        react_debug
        react_render_componentregistry
        react_render_core
        react_render_debug
        react_render_graphics
        react_render_uimanager
        reactnativejni
        rrc_view
        yoga
)
