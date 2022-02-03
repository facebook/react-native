# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_render_scheduler

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
  libreact_debug \
  libreact_render_componentregistry \
  libreact_render_core \
  libreact_render_debug \
  libreact_render_graphics \
  libreact_render_mounting \
  libreact_render_runtimescheduler \
  libreact_render_templateprocessor \
  libreact_render_uimanager \
  libreact_utils \
  libreact_config \
  librrc_root \
  librrc_view \
  libyoga

include $(BUILD_SHARED_LIBRARY)

$(call import-module,glog)
$(call import-module,jsi)
$(call import-module,folly)
$(call import-module,react/config)
$(call import-module,react/renderer/components/root)
$(call import-module,react/renderer/components/view)
$(call import-module,react/renderer/componentregistry)
$(call import-module,react/renderer/core)
$(call import-module,react/renderer/debug)
$(call import-module,react/renderer/graphics)
$(call import-module,react/renderer/mounting)
$(call import-module,react/renderer/uimanager)
$(call import-module,react/renderer/runtimescheduler)
$(call import-module,react/renderer/templateprocessor)
$(call import-module,react/utils)
$(call import-module,react/debug)
$(call import-module,yogajni)
