# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This CMake file takes care of creating everything you need to build and link
# your C++ source code in a React Native Application for Android.
# You just need to call `project(<my_project_name>)` and import this file.
# Specifically this file will:
# - Take care of creating a shared library called as your project
# - Take care of setting the correct compile options
# - Include all the pre-built libraries in your build graph
# - Link your library against those prebuilt libraries so you can access JSI, Fabric, etc.
# - Link your library against any autolinked library.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/cmake-utils/Android-prebuilt.cmake)

set(BUILD_DIR ${PROJECT_BUILD_DIR})
if(CMAKE_HOST_WIN32)
        string(REPLACE "\\" "/" BUILD_DIR ${BUILD_DIR})
endif()

file(GLOB input_SRC CONFIGURE_DEPENDS
        *.cpp
        ${BUILD_DIR}/generated/rncli/src/main/jni/*.cpp)

add_library(${CMAKE_PROJECT_NAME} SHARED ${input_SRC})

target_include_directories(${CMAKE_PROJECT_NAME}
        PUBLIC
                ${CMAKE_CURRENT_SOURCE_DIR}
                ${PROJECT_BUILD_DIR}/generated/rncli/src/main/jni)

target_compile_options(${CMAKE_PROJECT_NAME} PRIVATE -Wall -Werror -fexceptions -frtti -std=c++17 -DWITH_INSPECTOR=1 -DLOG_TAG=\"ReactNative\")

target_link_libraries(${CMAKE_PROJECT_NAME}
        fabricjni
        fbjni
        folly_runtime
        glog
        jsi
        react_codegen_rncore
        react_debug
        react_nativemodule_core
        react_render_componentregistry
        react_render_core
        react_render_debug
        react_render_graphics
        rrc_view
        runtimeexecutor
        turbomodulejsijni
        yoga)

# If project is on RN CLI v9, then we can use the following lines to link against the autolinked 3rd party libraries.
if(EXISTS ${PROJECT_BUILD_DIR}/generated/rncli/src/main/jni/Android-rncli.cmake)
        include(${PROJECT_BUILD_DIR}/generated/rncli/src/main/jni/Android-rncli.cmake)
        target_link_libraries(${CMAKE_PROJECT_NAME} ${AUTOLINKED_LIBRARIES})
endif()
