# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

# Flag to enable V8 in react-native code
V8_ENABLED := 1

LOCAL_MODULE := jsi

LOCAL_SRC_FILES := \
    jsi.cpp \
    JSIDynamic.cpp \

LOCAL_V8_FILES := \
    FileUtils.cpp \
    V8Runtime_shared.cpp \
    V8Runtime_droid.cpp \
    V8Platform.cpp \

LOCAL_JSC_FILES := \
   JSCRuntime.cpp \

LOCAL_C_INCLUDES += $(LOCAL_PATH)/..

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := -fexceptions -frtti -O3
LOCAL_SHARED_LIBRARIES := libfolly_json glog

ifeq ($(V8_ENABLED), 1)
  LOCAL_SRC_FILES += $(LOCAL_V8_FILES)
  LOCAL_SHARED_LIBRARIES += libv8 libv8platform libv8base
else
  LOCAL_SRC_FILES += $(LOCAL_JSC_FILES)
  LOCAL_SHARED_LIBRARIES += libjsc
endif

include $(BUILD_STATIC_LIBRARY)
