# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)
BUILD_PATH := $(LOCAL_PATH)/../../../../../build
FBJNI_PATH := $(BUILD_PATH)/fbjni/

include $(CLEAR_VARS)

LOCAL_SRC_FILES := $(FBJNI_PATH)/jni/$(TARGET_ARCH_ABI)/libfbjni.so

LOCAL_EXPORT_C_INCLUDES := $(FBJNI_PATH)/fbjni
LOCAL_MODULE := libfbjni

include $(PREBUILT_SHARED_LIBRARY)

