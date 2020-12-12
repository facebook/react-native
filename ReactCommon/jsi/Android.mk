# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := jsi

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/jsi/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS := -fexceptions -frtti -O3
LOCAL_SHARED_LIBRARIES := libfolly_json glog

include $(BUILD_STATIC_LIBRARY)


include $(CLEAR_VARS)

LOCAL_MODULE := jscruntime

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS := -fexceptions -frtti -O3
LOCAL_SHARED_LIBRARIES := libfolly_json libjsc glog

ifeq ($(BUILD_FABRIC),true)
  LOCAL_CFLAGS += -DRN_FABRIC_ENABLED
endif

include $(BUILD_STATIC_LIBRARY)
