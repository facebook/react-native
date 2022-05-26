# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_utils

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

LOCAL_C_INCLUDES := $(LOCAL_PATH) $(LOCAL_PATH)/../../
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../../

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

LOCAL_STATIC_LIBRARIES :=
LOCAL_SHARED_LIBRARIES := \
  libglog \
  libglog_init \
  libreact_debug

include $(BUILD_SHARED_LIBRARY)

$(call import-module,react/debug)
$(call import-module,fbgloginit)
$(call import-module,glog)
