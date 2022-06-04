# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall)

add_library(reactperfloggerjni SHARED reactperflogger/OnLoad.cpp)

target_include_directories(reactperfloggerjni
        PUBLIC
          ${CMAKE_CURRENT_SOURCE_DIR}
        PRIVATE
          ${CMAKE_CURRENT_SOURCE_DIR}/reactperflogger
)

target_link_libraries(reactperfloggerjni
        fb
        fbjni
        android
        reactperflogger)
