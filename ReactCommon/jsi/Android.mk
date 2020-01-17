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

LOCAL_SRC_FILES := \
    FileUtils.cpp \
    V8Runtime_shared.cpp \
    V8Runtime_basic.cpp \
    V8Runtime_droid.cpp \
    V8Platform.cpp \

LOCAL_MODULE := v8runtime
LOCAL_SHARED_LIBRARIES := libfolly_json glog libv8 libv8platform libv8base

LOCAL_C_INCLUDES := $(LOCAL_PATH) $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS := -fexceptions -frtti -O3
include $(BUILD_STATIC_LIBRARY)

$(call import-module,v8base)
$(call import-module,v8)
$(call import-module,v8platform)
