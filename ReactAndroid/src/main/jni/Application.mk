# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

APP_BUILD_SCRIPT := Android.mk

APP_ABI := armeabi-v7a x86 arm64-v8a x86_64
APP_PLATFORM := android-21

APP_MK_DIR := $(dir $(lastword $(MAKEFILE_LIST)))

# What is NDK_MODULE_PATH?
#   This is comparable to the PATH environment variable in Linux. The purpose
#   of NDK_MODULE_PATH is to provide a list of directories that contain modules
#   we want ndk-build to compile.
#
# What is HOST_DIRSEP?
#   In PATH, the directories are separated by a ':'.
#   In NDK_MODULE_PATH, the directories are separated by $(HOST_DIRSEP).
#
# Where are APP_MK_DIR, THIRD_PARTY_NDK_DIR, etc. defined?
#   The directories inside NDK_MODULE_PATH (ex: APP_MK_DIR, THIRD_PARTY_NDK_DIR,
#   etc.) are defined inside build.gradle.
NDK_MODULE_PATH := $(APP_MK_DIR)$(HOST_DIRSEP)$(THIRD_PARTY_NDK_DIR)$(HOST_DIRSEP)$(REACT_COMMON_DIR)$(HOST_DIRSEP)$(APP_MK_DIR)first-party$(HOST_DIRSEP)$(REACT_SRC_DIR)$(HOST_DIRSEP)$(REACT_GENERATED_SRC_DIR)

APP_STL := c++_shared

APP_CFLAGS := -Wall -Werror -fexceptions -frtti -DWITH_INSPECTOR=1
APP_CPPFLAGS := -std=c++1y
# Make sure every shared lib includes a .note.gnu.build-id header
APP_LDFLAGS := -Wl,--build-id

NDK_TOOLCHAIN_VERSION := clang
