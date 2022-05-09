# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := jscexecutor

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

LOCAL_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS += -fvisibility=hidden -fexceptions -frtti

LOCAL_STATIC_LIBRARIES :=  libjsireact jscruntime
LOCAL_SHARED_LIBRARIES := \
  libfb \
  libfbjni \
  libfolly_json \
  libjsi \
  libreactnativejni

include $(BUILD_SHARED_LIBRARY)
