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
        -Wno-gnu-zero-variadic-macro-arguments
        -DLOG_TAG=\"Fabric\")

file(GLOB rrc_text_SRC CONFIGURE_DEPENDS *.cpp)
add_library(rrc_text SHARED ${rrc_text_SRC})

target_include_directories(rrc_text PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(rrc_text
        glog
        folly_runtime
        glog_init
        jsi
        react_debug
        react_render_attributedstring
        react_render_core
        react_render_debug
        react_render_graphics
        react_render_mapbuffer
        react_render_mounting
        react_render_textlayoutmanager
        react_render_uimanager
        react_utils
        rrc_view
        yoga
)
