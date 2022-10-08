# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)

# Define the application dynamic library name here.
project(appmodules)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

add_subdirectory(${PROJECT_BUILD_DIR}/generated/source/codegen/jni/ codegen_build)
add_subdirectory(${REACT_COMMON_DIR}/react/nativemodule/samples/platform/android/ sampleturbomodule_build)

# RN Tester needs to link against the local codegen-ned library and a sample turbomobule
target_link_libraries(${CMAKE_PROJECT_NAME}
        react_codegen_AppSpecs
        sampleturbomodule)
