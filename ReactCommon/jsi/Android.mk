# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := jsi

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/jsi/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS := -fexceptions -frtti -O3
LOCAL_SHARED_LIBRARIES := libfolly_json glog

include $(BUILD_SHARED_LIBRARY)


include $(CLEAR_VARS)

LOCAL_MODULE := jscruntime

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS := -fexceptions -frtti -O3
LOCAL_SHARED_LIBRARIES := libfolly_json libjsc glog

# TODO: Remove this flag when ready.
# Android has this enabled by default, but the flag is still needed for iOS.
LOCAL_CFLAGS += -DRN_FABRIC_ENABLED

include $(BUILD_STATIC_LIBRARY)
