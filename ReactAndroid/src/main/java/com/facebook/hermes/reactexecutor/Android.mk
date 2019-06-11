# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)
HERMES_DIR := $(HERMES_WS_DIR)/hermes

LOCAL_MODULE := hermes-executor

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH) $(HERMES_DIR)/public $(HERMES_DIR)/API $(HERMES_DIR)/API/jsi  

LOCAL_CPP_FEATURES := exceptions

LOCAL_STATIC_LIBRARIES := libjsireact libjsi 
LOCAL_SHARED_LIBRARIES := libfolly_json libfb libreactnativejni libhermes

include $(BUILD_SHARED_LIBRARY)
