# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_render_textlayoutmanager

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp $(LOCAL_PATH)/platform/android/react/renderer/textlayoutmanager/*.cpp)

LOCAL_SHARED_LIBRARIES := \
  glog \
  libfb \
  libfbjni \
  libfolly_futures \
  libfolly_json \
  libglog_init \
  libmapbufferjni \
  libreact_debug \
  libreact_render_attributedstring \
  libreact_render_componentregistry \
  libreact_render_core \
  libreact_render_debug \
  libreact_render_graphics \
  libreact_render_mapbuffer \
  libreact_render_mounting \
  libreact_render_telemetry \
  libreact_render_uimanager \
  libreact_utils \
  libreactnativeutilsjni \
  libyoga

LOCAL_STATIC_LIBRARIES :=

LOCAL_C_INCLUDES := $(LOCAL_PATH)/../../../ $(LOCAL_PATH)/platform/android/

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../../../ $(LOCAL_PATH)/platform/android/

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

include $(BUILD_SHARED_LIBRARY)

$(call import-module,glog)
$(call import-module,fbjni)
$(call import-module,fb)
$(call import-module,folly)
$(call import-module,react/renderer/componentregistry)
$(call import-module,react/renderer/core)
$(call import-module,react/renderer/attributedstring)
$(call import-module,react/renderer/debug)
$(call import-module,react/renderer/mounting)
$(call import-module,react/renderer/graphics)
$(call import-module,react/renderer/uimanager)
$(call import-module,react/utils)
$(call import-module,yogajni)
$(call import-module,react/renderer/mapbuffer)
$(call import-module,react/renderer/telemetry)
