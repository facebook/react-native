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

file(GLOB rrc_textinput_SRC CONFIGURE_DEPENDS platform/android/react/renderer/components/androidtextinput/*.cpp)
add_library(rrc_textinput STATIC ${rrc_textinput_SRC})

target_include_directories(rrc_textinput
        PUBLIC
          ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
)

target_link_libraries(rrc_textinput
        glog
        folly_runtime
        glog_init
        jsi
        react_debug
        react_render_attributedstring
        react_render_componentregistry
        react_render_core
        react_render_debug
        react_render_graphics
        react_render_imagemanager
        react_render_mapbuffer
        react_render_mounting
        react_render_textlayoutmanager
        react_render_uimanager
        react_utils
        rrc_image
        rrc_text
        rrc_view
        yoga
)
