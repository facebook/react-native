# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)
REACT_NATIVE := $(LOCAL_PATH)/../../../../../../../..

LOCAL_MODULE := hermes-executor-release

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH) $(REACT_NATIVE)/ReactCommon/jsi $(REACT_NATIVE)/node_modules/hermesvm/android/include

LOCAL_CPP_FEATURES := exceptions

LOCAL_STATIC_LIBRARIES := libjsireact libjsi
LOCAL_SHARED_LIBRARIES := libfolly_json libfb libreactnativejni libhermes

include $(BUILD_SHARED_LIBRARY)


include $(CLEAR_VARS)
REACT_NATIVE := $(LOCAL_PATH)/../../../../../../../..

LOCAL_MODULE := hermes-executor-debug
LOCAL_CFLAGS := -DHERMES_ENABLE_DEBUGGER=1

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH) $(REACT_NATIVE)/ReactCommon/jsi $(REACT_NATIVE)/node_modules/hermesvm/android/include

LOCAL_CPP_FEATURES := exceptions

LOCAL_STATIC_LIBRARIES := libjsireact libjsi libhermes-inspector
LOCAL_SHARED_LIBRARIES := libfolly_json libfb libreactnativejni libhermes

include $(BUILD_SHARED_LIBRARY)
