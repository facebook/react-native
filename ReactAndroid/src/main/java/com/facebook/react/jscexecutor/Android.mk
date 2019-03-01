# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

# Flag to enable V8 in react-native code 
V8_ENABLED := 1

LOCAL_MODULE := jscexecutor

ifeq ($(V8_ENABLED), 0)
  LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
endif

LOCAL_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS += -fvisibility=hidden -fexceptions -frtti

LOCAL_STATIC_LIBRARIES := libjsi libjsireact
LOCAL_SHARED_LIBRARIES := libfolly_json libfb libreactnativejni

include $(BUILD_SHARED_LIBRARY)