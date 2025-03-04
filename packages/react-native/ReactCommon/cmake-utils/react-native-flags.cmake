# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# This CMake file exposes the React Native Flags that all the libraries should use when
# compiling a module that will end up inside libreactnative.so

SET(reactnative_FLAGS
        -Wall
        -Werror
        -fexceptions
        -frtti
        -std=c++20
        -DFOLLY_NO_CONFIG=1
)

# This function can be used to configure the reactnative flags for a specific target in
# a conveniente way. The usage is:
#
# target_compile_reactnative_options(target_name scope [tag])
#
# scope is either PUBLIC, PRIVATE or INTERFACE
# tag is optional and if set, will be passed to the -DLOG_TAG flag

function(target_compile_reactnative_options target_name scope)
  target_compile_options(${target_name} ${scope} ${reactnative_FLAGS})
  set (extra_args ${ARGN})
  list(LENGTH extra_args extra_count)
  set (tag "ReactNative")
  if (${extra_count} GREATER 0)
    list(GET extra_args 0 user_provided_tag)
    target_compile_options(${target_name} ${scope} -DLOG_TAG=\"${user_provided_tag}\")
  endif ()
endfunction()

