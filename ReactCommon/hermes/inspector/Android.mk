# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)
REACT_NATIVE := $(LOCAL_PATH)/../../..

include $(REACT_NATIVE)/ReactCommon/common.mk
include $(CLEAR_VARS)

LOCAL_MODULE := hermes-inspector

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp $(LOCAL_PATH)/detail/*.cpp $(LOCAL_PATH)/chrome/*.cpp)

LOCAL_C_ROOT := $(LOCAL_PATH)/../..

LOCAL_CFLAGS := -DHERMES_ENABLE_DEBUGGER=1 -DHERMES_INSPECTOR_FOLLY_KLUDGE=1
LOCAL_C_INCLUDES := $(LOCAL_C_ROOT) $(REACT_NATIVE)/ReactCommon/jsi $(call find-node-module,$(LOCAL_PATH),hermes-engine)/android/include
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_ROOT)

LOCAL_CPP_FEATURES := exceptions

LOCAL_SHARED_LIBRARIES := \
  jsinspector \
  libfb \
  libfbjni \
  libfolly_futures \
  libfolly_json \
  libglog \
  libhermes \
  libjsi

include $(BUILD_STATIC_LIBRARY)
