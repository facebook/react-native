# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_renderer_textlayourmanager_SRC CONFIGURE_DEPENDS
        *.cpp
        platform/android/react/renderer/textlayoutmanager/*.cpp)

add_library(react_renderer_textlayoutmanager
        OBJECT
        ${react_renderer_textlayourmanager_SRC})

target_include_directories(react_renderer_textlayoutmanager
        PUBLIC
          .
          ${REACT_COMMON_DIR}
          ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
)

target_link_libraries(react_renderer_textlayoutmanager
        glog
        fbjni
        folly_runtime
        mapbufferjni
        react_debug
        react_renderer_attributedstring
        react_renderer_componentregistry
        react_renderer_core
        react_renderer_debug
        react_renderer_graphics
        react_renderer_mapbuffer
        react_renderer_mounting
        react_renderer_telemetry
        react_utils
        reactnativejni
        yoga
)
target_compile_reactnative_options(react_renderer_textlayoutmanager PRIVATE "Fabric")
target_compile_options(react_renderer_textlayoutmanager PRIVATE -Wpedantic)
