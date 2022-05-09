# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

THIS_DIR := $(call my-dir)

include $(REACT_ANDROID_DIR)/Android-prebuilt.mk

# SampleNativeModule
include $(REACT_COMMON_DIR)/react/nativemodule/samples/platform/android/Android.mk
include $(GENERATED_SRC_DIR)/codegen/jni/Android.mk

LOCAL_PATH := $(THIS_DIR)

include $(CLEAR_VARS)
LOCAL_MODULE := rntester_appmodules
# Note: We are linking against react_codegen_rntester hence no need to built the react-native-codegen output.
LOCAL_C_INCLUDES := $(LOCAL_PATH) $(GENERATED_SRC_DIR)/codegen/jni
LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH) $(GENERATED_SRC_DIR)/codegen/jni
LOCAL_SHARED_LIBRARIES := \
  libfabricjni \
  libfbjni \
  libfolly_futures \
  libfolly_json \
  libglog \
  libreact_codegen_rncore \
  libreact_codegen_rntester \
  libreact_debug \
  libreact_nativemodule_core \
  libreact_render_componentregistry \
  libreact_render_core \
  libreact_render_debug \
  libreact_render_graphics \
  librrc_view \
  libruntimeexecutor \
  libturbomodulejsijni \
  libyoga

LOCAL_STATIC_LIBRARIES := libsampleturbomodule

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"
LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall
include $(BUILD_SHARED_LIBRARY)
