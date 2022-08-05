# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := fabricjni

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

LOCAL_SHARED_LIBRARIES := \
  libbutter \
  libfb \
  libfbjni \
  libfolly_futures \
  libfolly_json \
  libglog \
  libglog_init \
  libjsi \
  libmapbufferjni \
  libreact_codegen_rncore \
  libreact_debug \
  libreact_render_animations \
  libreact_render_attributedstring \
  libreact_render_core \
  libreact_render_debug \
  libreact_render_graphics \
  libreact_render_imagemanager \
  libreact_render_mapbuffer \
  libreact_render_mounting \
  libreact_render_runtimescheduler \
  libreact_render_scheduler \
  libreact_render_telemetry \
  libreact_render_templateprocessor \
  libreact_render_textlayoutmanager \
  libreact_render_uimanager \
  libreact_utils \
  libreact_config \
  libreactnativejni \
  librrc_image \
  librrc_root \
  librrc_unimplementedview \
  librrc_view \
  libyoga \
  react_render_componentregistry \
  rrc_text

LOCAL_STATIC_LIBRARIES := \
  librrc_slider \
  librrc_progressbar \
  librrc_switch \
  librrc_modal \
  librrc_scrollview \
  librrc_textinput

LOCAL_C_INCLUDES := $(LOCAL_PATH)/

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

include $(BUILD_SHARED_LIBRARY)

$(call import-module,fbgloginit)
$(call import-module,folly)
$(call import-module,fb)
$(call import-module,fbjni)
$(call import-module,yogajni)
$(call import-module,glog)

$(call import-module,react/utils)
$(call import-module,react/debug)
$(call import-module,react/config)
$(call import-module,react/renderer/animations)
$(call import-module,react/renderer/attributedstring)
$(call import-module,react/renderer/componentregistry)
$(call import-module,react/renderer/core)
$(call import-module,react/renderer/components/image)
$(call import-module,react/renderer/components/modal)
$(call import-module,react/renderer/components/root)
$(call import-module,react/renderer/components/progressbar)
$(call import-module,react/renderer/components/scrollview)
$(call import-module,react/renderer/components/slider)
$(call import-module,react/renderer/components/switch)
$(call import-module,react/renderer/components/text)
$(call import-module,react/renderer/components/textinput)
$(call import-module,react/renderer/components/unimplementedview)
$(call import-module,react/renderer/components/view)
$(call import-module,react/renderer/debug)
$(call import-module,react/renderer/graphics)
$(call import-module,react/renderer/imagemanager)
$(call import-module,react/renderer/mapbuffer)
$(call import-module,react/renderer/mounting)
$(call import-module,react/renderer/runtimescheduler)
$(call import-module,react/renderer/scheduler)
$(call import-module,react/renderer/templateprocessor)
$(call import-module,react/renderer/textlayoutmanager)
$(call import-module,react/renderer/uimanager)
$(call import-module,react/renderer/telemetry)
