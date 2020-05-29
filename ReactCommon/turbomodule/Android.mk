# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := turbomodule

LOCAL_SRC_FILES := \
  $(wildcard $(LOCAL_PATH)/core/ReactCommon/*.cpp) \
  $(wildcard $(LOCAL_PATH)/core/platform/android/ReactCommon/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/core $(LOCAL_PATH)/core/ReactCommon $(LOCAL_PATH)/core/platform/android/ReactCommon
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/core $(LOCAL_PATH)/core/platform/android

LOCAL_SHARED_LIBRARIES := libfb libfbjni libglog_init libreactnativejni
LOCAL_STATIC_LIBRARIES := libreactnative libcallinvoker libjsi

LOCAL_CFLAGS += -fexceptions -frtti -std=c++14 -Wall

include $(BUILD_STATIC_LIBRARY)

