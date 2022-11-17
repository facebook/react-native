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
        -DLOG_TAG=\"Fabric\")

file(GLOB rrc_modal_SRC CONFIGURE_DEPENDS *.cpp)
add_library(rrc_modal STATIC ${rrc_modal_SRC})

target_include_directories(rrc_modal PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(rrc_modal
        glog
        folly_runtime
        glog_init
        react_codegen_rncore
        react_render_componentregistry
        react_render_core
        react_render_debug
        react_render_graphics
        react_render_imagemanager
        react_render_mapbuffer
        react_render_uimanager
        rrc_image
        rrc_view
        yoga
)
