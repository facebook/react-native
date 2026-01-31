# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/internal/react-native-platform-selector.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

react_native_android_selector(platform_SRC
        platform/android/react/renderer/dom/*.cpp
        platform/cxx/react/renderer/dom/*.cpp
)
file(GLOB react_renderer_dom_SRC CONFIGURE_DEPENDS *.cpp ${platform_SRC})

add_library(react_renderer_dom OBJECT ${react_renderer_dom_SRC})

react_native_android_selector(platform_DIR
        ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
        ${CMAKE_CURRENT_SOURCE_DIR}/platform/cxx/)
target_include_directories(react_renderer_dom PUBLIC
        ${REACT_COMMON_DIR}
        ${platform_DIR})

react_native_android_selector(platform_DIR_PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/react/renderer/dom/
        ${CMAKE_CURRENT_SOURCE_DIR}/platform/cxx/react/renderer/dom/)
target_include_directories(react_renderer_dom PRIVATE
        ${platform_DIR_PRIVATE})

target_link_libraries(react_renderer_dom
        react_renderer_core
        react_renderer_graphics
        react_renderer_textlayoutmanager
        rrc_root
        rrc_text)
target_compile_reactnative_options(react_renderer_dom PRIVATE)
target_compile_options(react_renderer_dom PRIVATE -Wpedantic)
