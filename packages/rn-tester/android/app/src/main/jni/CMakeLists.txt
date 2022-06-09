# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# Define the library name here.
project(rntester_appmodules)

include(${REACT_ANDROID_DIR}/cmake-utils/Android-prebuilt.cmake)
add_subdirectory(${PROJECT_BUILD_DIR}/generated/source/codegen/jni/ codegen_build)
add_subdirectory(${REACT_COMMON_DIR}/react/nativemodule/samples/platform/android/ sampleturbomodule_build)

file(GLOB input_SRC CONFIGURE_DEPENDS *.cpp)
add_library(${CMAKE_PROJECT_NAME} SHARED ${input_SRC})

target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_compile_options(${CMAKE_PROJECT_NAME} PRIVATE -Wall -Werror -fexceptions -frtti -std=c++17 -DWITH_INSPECTOR=1 -DLOG_TAG=\"ReactNative\")

target_link_libraries(${CMAKE_PROJECT_NAME}
        fabricjni
        fbjni
        folly_runtime
        glog
        jsi
        react_codegen_AppSpecs
        react_codegen_rncore
        react_debug
        react_nativemodule_core
        react_render_componentregistry
        react_render_core
        react_render_debug
        react_render_graphics
        rrc_view
        runtimeexecutor
        sampleturbomodule
        turbomodulejsijni
        yoga)
