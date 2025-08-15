# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

add_library(glog
        STATIC
        glog-0.3.5/src/demangle.cc
        glog-0.3.5/src/logging.cc
        glog-0.3.5/src/raw_logging.cc
        glog-0.3.5/src/signalhandler.cc
        glog-0.3.5/src/symbolize.cc
        glog-0.3.5/src/utilities.cc
        glog-0.3.5/src/vlog_is_on.cc
        )

# For private compilation, we include all the headers.
# config.h is also there.
target_include_directories(glog PRIVATE .)
# For consumer, we set the `exported` dir as the
# include folder.
target_include_directories(glog PUBLIC exported)

target_compile_reactnative_options(glog PRIVATE)

target_compile_options(glog PRIVATE
        -Wwrite-strings
        -Woverloaded-virtual
        -Wno-sign-compare
        -DNDEBUG
        -g
        -O2
        -DHAVE_PREAD=1
)

