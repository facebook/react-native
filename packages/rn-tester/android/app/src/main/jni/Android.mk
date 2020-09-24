# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

#############################################
# Prebuilt libraries off ReactAndroid build #
#############################################

include $(CLEAR_VARS)
LOCAL_MODULE := react_nativemodule_core
LOCAL_SRC_FILES := $(REACT_NDK_EXPORT_DIR)/$(TARGET_ARCH_ABI)/libreact_nativemodule_core.so
# TODO: These needs to be synced with the other Android.mk files -- not efficient.
# Note: By doing this, it delegates all header includes lookup to this .so.
LOCAL_EXPORT_C_INCLUDES := \
  $(FIRST_PARTY_NDK_DIR)/fbjni/headers \
  $(REACT_ANDROID_SRC_DIR)/jni \
  $(REACT_COMMON_DIR)/callinvoker \
  $(REACT_COMMON_DIR)/jsi \
  $(REACT_COMMON_DIR)/react/nativemodule/core \
  $(REACT_COMMON_DIR)/react/nativemodule/core/platform/android \
  $(REACT_GENERATED_SRC_DIR)/codegen/jni \
  $(THIRD_PARTY_NDK_DIR)/boost/boost_1_63_0 \
  $(THIRD_PARTY_NDK_DIR)/double-conversion \
  $(THIRD_PARTY_NDK_DIR)/folly \
  $(THIRD_PARTY_NDK_DIR)/glog/exported
# Note: Sync with folly/Android.mk.
FOLLY_FLAGS := \
  -DFOLLY_NO_CONFIG=1 \
  -DFOLLY_HAVE_CLOCK_GETTIME=1 \
  -DFOLLY_HAVE_MEMRCHR=1 \
  -DFOLLY_USE_LIBCPP=1 \
  -DFOLLY_MOBILE=1 \
  -DFOLLY_HAVE_XSI_STRERROR_R=1
LOCAL_CFLAGS += $(FOLLY_FLAGS)
LOCAL_EXPORT_CPPFLAGS := $(FOLLY_FLAGS)
include $(PREBUILT_SHARED_LIBRARY)

include $(CLEAR_VARS)
LOCAL_MODULE := react_nativemodule_manager
LOCAL_SRC_FILES := $(REACT_NDK_EXPORT_DIR)/$(TARGET_ARCH_ABI)/libreact_nativemodule_manager.so
LOCAL_EXPORT_C_INCLUDES := \
  $(REACT_ANDROID_SRC_DIR)/java/com/facebook/react/turbomodule/core/jni
include $(PREBUILT_SHARED_LIBRARY)

include $(CLEAR_VARS)
LOCAL_MODULE := react_codegen_reactandroidspec
LOCAL_SRC_FILES := $(REACT_NDK_EXPORT_DIR)/$(TARGET_ARCH_ABI)/libreact_codegen_reactandroidspec.so
LOCAL_EXPORT_C_INCLUDES := \
  $(REACT_GENERATED_SRC_DIR)/codegen/jni
include $(PREBUILT_SHARED_LIBRARY)



####################################
# RNTester app specific definition #
####################################

include $(CLEAR_VARS)
LOCAL_MODULE := rntester_appmodules
LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)
LOCAL_SHARED_LIBRARIES := libreact_nativemodule_core libreact_nativemodule_manager libreact_codegen_reactandroidspec
LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"
LOCAL_CFLAGS += -fexceptions -frtti -std=c++14 -Wall
include $(BUILD_SHARED_LIBRARY)
