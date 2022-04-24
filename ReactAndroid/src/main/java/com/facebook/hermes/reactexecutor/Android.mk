# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)
REACT_NATIVE := $(LOCAL_PATH)/../../../../../../../..

include $(REACT_NATIVE)/ReactCommon/common.mk
include $(CLEAR_VARS)

LOCAL_MODULE := hermes-executor-release

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

LOCAL_C_INCLUDES := $(LOCAL_PATH) $(REACT_NATIVE)/ReactCommon/jsi $(call find-node-module,$(LOCAL_PATH),hermes-engine)/android/include

LOCAL_CPP_FEATURES := exceptions

LOCAL_STATIC_LIBRARIES := libjsireact libhermes-executor-common-release
LOCAL_SHARED_LIBRARIES := \
  libfb \
  libfbjni \
  libfolly_json \
  libhermes \
  libjsi \
  libreactnativejni

include $(BUILD_SHARED_LIBRARY)


include $(CLEAR_VARS)

LOCAL_MODULE := hermes-executor-debug
LOCAL_CFLAGS := -DHERMES_ENABLE_DEBUGGER=1

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

LOCAL_C_INCLUDES := $(LOCAL_PATH) $(REACT_NATIVE)/ReactCommon/jsi $(call find-node-module,$(LOCAL_PATH),hermes-engine)/android/include

LOCAL_CPP_FEATURES := exceptions

LOCAL_STATIC_LIBRARIES := libjsireact libhermes-executor-common-debug
LOCAL_SHARED_LIBRARIES := \
  libfb \
  libfbjni \
  libfolly_json \
  libhermes \
  libjsi \
  libreactnativejni

include $(BUILD_SHARED_LIBRARY)
