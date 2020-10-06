# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

THIS_DIR := $(call my-dir)

include $(REACT_ANDROID_DIR)/Android-prebuilt.mk

# SampleNativeModule
include $(REACT_COMMON_DIR)/react/nativemodule/samples/platform/android/Android.mk

LOCAL_PATH := $(THIS_DIR)

include $(CLEAR_VARS)
LOCAL_MODULE := rntester_appmodules
# Note: Build the react-native-codegen output along with other app-specific C++ files.
LOCAL_C_INCLUDES := $(LOCAL_PATH) $(GENERATED_SRC_DIR)/codegen/jni
LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp) $(wildcard $(GENERATED_SRC_DIR)/codegen/jni/*.cpp)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH) $(GENERATED_SRC_DIR)/codegen/jni
LOCAL_SHARED_LIBRARIES := libfbjni libreact_nativemodule_core libturbomodulejsijni libreact_codegen_reactandroidspec
LOCAL_STATIC_LIBRARIES := libsampleturbomodule
LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"
LOCAL_CFLAGS += -fexceptions -frtti -std=c++14 -Wall
include $(BUILD_SHARED_LIBRARY)
