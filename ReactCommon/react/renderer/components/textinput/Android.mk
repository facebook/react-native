# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := rrc_textinput

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/androidtextinput/react/renderer/components/androidtextinput/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/androidtextinput/react/renderer/components/androidtextinput/
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/androidtextinput/

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

LOCAL_STATIC_LIBRARIES :=

LOCAL_SHARED_LIBRARIES := \
  glog \
  libfolly_json \
  libglog_init \
  libjsi \
  libreact_debug \
  libreact_render_attributedstring \
  libreact_render_componentregistry \
  libreact_render_core \
  libreact_render_debug \
  libreact_render_graphics \
  libreact_render_imagemanager \
  libreact_render_mapbuffer \
  libreact_render_mounting \
  libreact_render_textlayoutmanager \
  libreact_render_uimanager \
  libreact_utils \
  librrc_image \
  librrc_text \
  librrc_view \
  libyoga

include $(BUILD_STATIC_LIBRARY)

$(call import-module,glog)
$(call import-module,folly)
$(call import-module,fbgloginit)
$(call import-module,react/renderer/attributedstring)
$(call import-module,react/renderer/componentregistry)
$(call import-module,react/renderer/core)
$(call import-module,react/renderer/debug)
$(call import-module,react/renderer/graphics)
$(call import-module,react/renderer/imagemanager)
$(call import-module,react/renderer/mounting)
$(call import-module,react/renderer/textlayoutmanager)
$(call import-module,react/renderer/uimanager)
$(call import-module,react/renderer/components/image)
$(call import-module,react/renderer/components/view)
$(call import-module,react/renderer/components/text)
$(call import-module,react/utils)
$(call import-module,react/debug)
$(call import-module,yogajni)
$(call import-module,react/renderer/mapbuffer)
