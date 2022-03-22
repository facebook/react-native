# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"Fabric\")

file(GLOB rrc_slider_SRC CONFIGURE_DEPENDS *.cpp platform/android/react/renderer/components/slider/*.cpp)
add_library(rrc_slider STATIC ${rrc_slider_SRC})

target_include_directories(rrc_slider
        PUBLIC
        ${REACT_COMMON_DIR}
        ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
)

target_link_libraries(rrc_slider
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
        react_render_imagemanager
        react_render_mapbuffer
        react_render_uimanager
        reactnativeutilsjni
        rrc_image
        rrc_view
        yoga
)
