# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# This function can be used to define a dependency for Android, with optional
# fallback for cross platform.
#
# Usage:
# react_native_android_selector(jsijni jsijni jsi)
# react_native_android_selector(fabricjni fabricjni "")
# target_link_librarues(target_name ${jsijni} ${fabricjni})

function(react_native_android_selector output_var name fallback)
  if(ANDROID)
    set(${output_var} ${name})
  else()
    set(${output_var} ${fallback})
  endif()
  set(${output_var} ${${output_var}} PARENT_SCOPE)
endfunction()
