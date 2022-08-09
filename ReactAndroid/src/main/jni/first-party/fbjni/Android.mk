# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)

LOCAL_SRC_FILES := $(LOCAL_PATH)/jni/$(TARGET_ARCH_ABI)/libfbjni.so

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/headers
LOCAL_MODULE := libfbjni

include $(PREBUILT_SHARED_LIBRARY)
