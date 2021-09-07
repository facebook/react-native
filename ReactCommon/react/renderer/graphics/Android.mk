# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_render_graphics

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp $(LOCAL_PATH)/platform/cxx/react/renderer/graphics/*.cpp)

LOCAL_SHARED_LIBRARIES := libfolly_json

LOCAL_STATIC_LIBRARIES :=

LOCAL_C_INCLUDES := $(LOCAL_PATH)/../../../ $(LOCAL_PATH)/platform/cxx/

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../../../ $(LOCAL_PATH)/platform/cxx/

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++14 -Wall

include $(BUILD_SHARED_LIBRARY)

$(call import-module,folly)
