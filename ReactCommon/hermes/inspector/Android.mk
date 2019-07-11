# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)
REACT_NATIVE := $(LOCAL_PATH)/../../..

LOCAL_MODULE := hermes-inspector

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp $(LOCAL_PATH)/detail/*.cpp $(LOCAL_PATH)/chrome/*.cpp)

LOCAL_C_ROOT := $(LOCAL_PATH)/../..

LOCAL_CFLAGS := -DHERMES_ENABLE_DEBUGGER=1
LOCAL_C_INCLUDES := $(LOCAL_C_ROOT) $(REACT_NATIVE)/ReactCommon/jsi $(REACT_NATIVE)/node_modules/hermesvm/android/include
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_ROOT)

LOCAL_CPP_FEATURES := exceptions

LOCAL_STATIC_LIBRARIES := libjsi
LOCAL_SHARED_LIBRARIES := jsinspector libfb libfolly_futures libfolly_json libhermes

include $(BUILD_SHARED_LIBRARY)
