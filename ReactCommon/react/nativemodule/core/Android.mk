# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_nativemodule_core

LOCAL_C_INCLUDES := $(LOCAL_PATH)/../../../ $(LOCAL_PATH)/ReactCommon $(LOCAL_PATH)/platform/android/ReactCommon

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/ReactCommon/*.cpp) $(wildcard $(LOCAL_PATH)/platform/android/ReactCommon/*.cpp)

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH) $(LOCAL_PATH)/platform/android/

LOCAL_SHARED_LIBRARIES := libfbjni libfolly_json libreactnativejni

LOCAL_STATIC_LIBRARIES := libjsi libreactperflogger

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++14 -Wall

include $(BUILD_SHARED_LIBRARY)

$(call import-module,folly)
$(call import-module,jsi)
$(call import-module,reactperflogger)
