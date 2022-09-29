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
# - Make sure ccache is used as part of the compilation process, if you have it installed.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# If you have ccache installed, we're going to honor it.
find_program(CCACHE_FOUND ccache)
if(CCACHE_FOUND)
  set_property(GLOBAL PROPERTY RULE_LAUNCH_COMPILE ccache)
  set_property(GLOBAL PROPERTY RULE_LAUNCH_LINK ccache)
endif(CCACHE_FOUND)

include(${REACT_ANDROID_DIR}/cmake-utils/Android-prebuilt.cmake)

file(GLOB input_SRC CONFIGURE_DEPENDS
        *.cpp
        ${PROJECT_BUILD_DIR}/generated/rncli/src/main/jni/*.cpp)

add_library(${CMAKE_PROJECT_NAME} SHARED ${input_SRC})

target_include_directories(${CMAKE_PROJECT_NAME}
        PUBLIC
                ${CMAKE_CURRENT_SOURCE_DIR}
                ${PROJECT_BUILD_DIR}/generated/rncli/src/main/jni)

target_compile_options(${CMAKE_PROJECT_NAME} PRIVATE -Wall -Werror -fexceptions -frtti -std=c++17 -DWITH_INSPECTOR=1 -DLOG_TAG=\"ReactNative\")

# Prefab packages
find_package(ReactAndroid REQUIRED CONFIG)
add_library(react_render_debug ALIAS ReactAndroid::react_render_debug)
add_library(turbomodulejsijni ALIAS ReactAndroid::turbomodulejsijni)
add_library(runtimeexecutor ALIAS ReactAndroid::runtimeexecutor)
add_library(react_codegen_rncore ALIAS ReactAndroid::react_codegen_rncore)
add_library(react_debug ALIAS ReactAndroid::react_debug)
add_library(react_render_componentregistry ALIAS ReactAndroid::react_render_componentregistry)
add_library(react_newarchdefaults ALIAS ReactAndroid::react_newarchdefaults)

target_link_libraries(${CMAKE_PROJECT_NAME}
        fabricjni
        fbjni
        folly_runtime
        glog
        jsi
        react_codegen_rncore                # prefab ready
        react_debug                         # prefab ready
        react_nativemodule_core
        react_newarchdefaults               # prefab ready
        react_render_componentregistry      # prefab ready
        react_render_core
        react_render_debug                  # prefab ready
        react_render_graphics
        react_render_mapbuffer
        rrc_view
        runtimeexecutor                     # prefab ready
        turbomodulejsijni                   # prefab ready
        yoga)

# If project is on RN CLI v9, then we can use the following lines to link against the autolinked 3rd party libraries.
if(EXISTS ${PROJECT_BUILD_DIR}/generated/rncli/src/main/jni/Android-rncli.cmake)
        include(${PROJECT_BUILD_DIR}/generated/rncli/src/main/jni/Android-rncli.cmake)
        target_link_libraries(${CMAKE_PROJECT_NAME} ${AUTOLINKED_LIBRARIES})
endif()
