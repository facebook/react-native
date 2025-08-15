# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

# This is the 'glue' library responsible of allowing to do so-merging in React Native
# OSS. This library contains just a .c file that is included in every merged library.
#
# The header file is included in every merged library during compilation and takes care
# of the redefinition of the JNI_OnLoad function to JNI_OnLoad_Weak.
#
# More on this mechanism: https://github.com/fbsamples/android-native-library-merging-demo

add_library(jni_lib_merge_glue OBJECT jni_lib_merge.c)

add_definitions(-DJNI_MERGE_PRINT_ONLOAD)

target_include_directories(jni_lib_merge_glue PUBLIC jni-lib-merge)

target_link_libraries(jni_lib_merge_glue PUBLIC log)
target_compile_options(jni_lib_merge_glue PRIVATE -frtti -fexceptions)
