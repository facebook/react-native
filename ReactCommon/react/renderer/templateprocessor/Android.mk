# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_render_templateprocessor

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../../../

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

LOCAL_STATIC_LIBRARIES :=

LOCAL_SHARED_LIBRARIES := \
  glog \
  libfolly_futures \
  libfolly_json \
  libjsi \
  libreact_render_componentregistry \
  libreact_render_core \
  libreact_render_debug \
  libreact_utils \
  libreact_config \
  react_render_uimanager

include $(BUILD_SHARED_LIBRARY)

$(call import-module,glog)
$(call import-module,jsi)
$(call import-module,folly)
$(call import-module,react/config)
$(call import-module,react/renderer/core)
$(call import-module,react/renderer/debug)
$(call import-module,react/renderer/uimanager)
$(call import-module,react/utils)
$(call import-module,react/renderer/componentregistry)
