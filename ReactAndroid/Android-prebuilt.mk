# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This configuration provides access to most common React Native prebuilt .so files
# to avoid recompiling each of the libraries outside of ReactAndroid NDK compilation.
# Hosting app's/library's Android.mk can include this Android-prebuilt.mk file to
# get access to those .so to depend on.
# NOTES:
# * Currently, it assumes building React Native from source.
# * Not every .so is listed here (yet).
# * Static libs are not covered here (yet).

LOCAL_PATH := $(call my-dir)

FIRST_PARTY_NDK_DIR := $(REACT_ANDROID_DIR)/src/main/jni/first-party
THIRD_PARTY_NDK_DIR := $(REACT_ANDROID_BUILD_DIR)/third-party-ndk
REACT_ANDROID_SRC_DIR := $(REACT_ANDROID_DIR)/src/main
REACT_COMMON_DIR := $(REACT_ANDROID_DIR)/../ReactCommon
REACT_GENERATED_SRC_DIR := $(REACT_ANDROID_BUILD_DIR)/generated/source
# Note: this only have .so, not .a
REACT_NDK_EXPORT_DIR := $(PROJECT_BUILD_DIR)/react-ndk/exported

# fb
include $(CLEAR_VARS)
LOCAL_MODULE := fb
LOCAL_SRC_FILES := $(REACT_NDK_EXPORT_DIR)/$(TARGET_ARCH_ABI)/libfb.so
LOCAL_EXPORT_C_INCLUDES := $(FIRST_PARTY_NDK_DIR)/fb/include
include $(PREBUILT_SHARED_LIBRARY)

# folly_json
include $(CLEAR_VARS)
LOCAL_MODULE := folly_json
LOCAL_SRC_FILES := $(REACT_NDK_EXPORT_DIR)/$(TARGET_ARCH_ABI)/libfolly_json.so
LOCAL_EXPORT_C_INCLUDES := \
  $(THIRD_PARTY_NDK_DIR)/boost/boost_1_63_0 \
  $(THIRD_PARTY_NDK_DIR)/double-conversion \
  $(THIRD_PARTY_NDK_DIR)/folly
# Note: Sync with folly/Android.mk.
FOLLY_FLAGS := \
  -DFOLLY_NO_CONFIG=1 \
  -DFOLLY_HAVE_CLOCK_GETTIME=1 \
  -DFOLLY_HAVE_MEMRCHR=1 \
  -DFOLLY_USE_LIBCPP=1 \
  -DFOLLY_MOBILE=1 \
  -DFOLLY_HAVE_XSI_STRERROR_R=1
LOCAL_CFLAGS += $(FOLLY_FLAGS)
LOCAL_EXPORT_CPPFLAGS := $(FOLLY_FLAGS)
include $(PREBUILT_SHARED_LIBRARY)

# folly_futures
include $(CLEAR_VARS)
LOCAL_MODULE := folly_futures
LOCAL_SRC_FILES := $(REACT_NDK_EXPORT_DIR)/$(TARGET_ARCH_ABI)/libfolly_futures.so
LOCAL_SHARED_LIBRARIES := liblibfolly_json
include $(PREBUILT_SHARED_LIBRARY)

# glog
include $(CLEAR_VARS)
LOCAL_MODULE := glog
LOCAL_SRC_FILES := $(REACT_NDK_EXPORT_DIR)/$(TARGET_ARCH_ABI)/libglog.so
LOCAL_EXPORT_C_INCLUDES := $(THIRD_PARTY_NDK_DIR)/glog/exported
LOCAL_SHARED_LIBRARIES := libglog
include $(PREBUILT_SHARED_LIBRARY)

# react_nativemodule_core
include $(CLEAR_VARS)
LOCAL_MODULE := react_nativemodule_core
LOCAL_SRC_FILES := $(REACT_NDK_EXPORT_DIR)/$(TARGET_ARCH_ABI)/libreact_nativemodule_core.so
LOCAL_EXPORT_C_INCLUDES := \
  $(REACT_ANDROID_SRC_DIR)/jni \
  $(REACT_COMMON_DIR)/callinvoker \
  $(REACT_COMMON_DIR)/jsi \
  $(REACT_COMMON_DIR)/react/nativemodule/core \
  $(REACT_COMMON_DIR)/react/nativemodule/core/platform/android
LOCAL_SHARED_LIBRARIES := libfolly_json
include $(PREBUILT_SHARED_LIBRARY)

# turbomodulejsijni
include $(CLEAR_VARS)
LOCAL_MODULE := turbomodulejsijni
LOCAL_SRC_FILES := $(REACT_NDK_EXPORT_DIR)/$(TARGET_ARCH_ABI)/libturbomodulejsijni.so
LOCAL_EXPORT_C_INCLUDES := \
  $(REACT_ANDROID_SRC_DIR)/java/com/facebook/react/turbomodule/core/jni
include $(PREBUILT_SHARED_LIBRARY)

# react_codegen_reactandroidspec
include $(CLEAR_VARS)
LOCAL_MODULE := react_codegen_reactandroidspec
LOCAL_SRC_FILES := $(REACT_NDK_EXPORT_DIR)/$(TARGET_ARCH_ABI)/libreact_codegen_reactandroidspec.so
LOCAL_EXPORT_C_INCLUDES := \
  $(REACT_GENERATED_SRC_DIR)/codegen/jni
include $(PREBUILT_SHARED_LIBRARY)

# fbjni
include $(FIRST_PARTY_NDK_DIR)/fbjni/Android.mk
