# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fvisibility=hidden -fexceptions -frtti)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)

file(GLOB jscexecutor_SRC CONFIGURE_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/*.cpp)
add_library(jscexecutor OBJECT ${jscexecutor_SRC})

target_include_directories(jscexecutor PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})
target_merge_so(jscexecutor)

# Patch from Expo: https://github.com/expo/react-native/blob/02714ab44d1e206fa80e81aef618e61017cccdc1/ReactAndroid/src/main/java/com/facebook/react/jscexecutor/CMakeLists.txt#L16-L25
# Explicitly link libgcc.a to prevent undefined `_Unwind_Resume` symbol and crash from throwing c++ exceptions even someone tries to catch the exceptions.
# according to https://android.googlesource.com/platform/ndk/+/master/docs/BuildSystemMaintainers.md#unwinding,
# we should put the unwinder between static libs and shared libs.
#
# TODO(ncor): we don't need this patch anymore after upgrading to ndk r23
if(ANDROID_NDK_REVISION VERSION_LESS "23.0.0")
  set(LIB_UNWIND gcc)
else()
  set(LIB_UNWIND unwind)
endif()

target_link_libraries(jscexecutor
        ${LIB_UNWIND}
        jscruntime
        jsi
        reactnative)
