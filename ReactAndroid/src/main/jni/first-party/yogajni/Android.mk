# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := yoga

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/jni/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/jni

LOCAL_CFLAGS += -fvisibility=hidden -fexceptions -frtti -O3

LOCAL_LDLIBS += -landroid -llog
LOCAL_STATIC_LIBRARIES := libyogacore
LOCAL_SHARED_LIBRARIES := libfb libfbjni

include $(BUILD_SHARED_LIBRARY)

$(call import-module,yoga)
$(call import-module,fb)
$(call import-module,fbjni)
