# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

##################
### jscruntime ###
##################

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# Copy jsc headers into JavaScriptCore subdirectory
get_target_property(JSC_PREFAB_INCLUDE_DIR jsc INTERFACE_INCLUDE_DIRECTORIES)
set(JSC_INCLUDE_DIR ${CMAKE_CURRENT_BINARY_DIR}/include)
file(MAKE_DIRECTORY ${JSC_INCLUDE_DIR})
file(GLOB JSC_HEADERS "${JSC_PREFAB_INCLUDE_DIR}/*.h")
foreach(HEADER ${JSC_HEADERS})
        file(COPY ${HEADER} DESTINATION "${JSC_INCLUDE_DIR}/JavaScriptCore")
endforeach()

add_compile_options(
        -fexceptions
        -frtti
        -O3
        -Wno-unused-lambda-capture
        -DLOG_TAG=\"ReactNative\")

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)

add_library(jscruntime
        OBJECT
        JSCRuntime.h
        JSCRuntime.cpp)

target_include_directories(jscruntime PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_include_directories(jscruntime PRIVATE ${JSC_INCLUDE_DIR})
target_merge_so(jscruntime)

target_link_libraries(jscruntime
        jsc
        jsi
        reactnative)

if(NOT ${CMAKE_BUILD_TYPE} MATCHES Debug)
        target_compile_options(jscruntime PRIVATE -DNDEBUG)
endif()
