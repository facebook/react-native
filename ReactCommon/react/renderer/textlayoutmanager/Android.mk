# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_render_textlayoutmanager

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp $(LOCAL_PATH)/platform/android/react/renderer/textlayoutmanager/*.cpp)

LOCAL_SHARED_LIBRARIES := libfolly_futures libreactnativeutilsjni libreact_utils libfb libfbjni libreact_render_uimanager libreact_render_componentregistry libreact_render_attributedstring libfolly_json libyoga libfolly_json libreact_render_core libreact_render_debug libreact_render_graphics

LOCAL_STATIC_LIBRARIES :=

LOCAL_C_INCLUDES := $(LOCAL_PATH)/../../../ $(LOCAL_PATH)/platform/android/

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../../../ $(LOCAL_PATH)/platform/android/

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++14 -Wall

include $(BUILD_SHARED_LIBRARY)

$(call import-module,glog)
$(call import-module,fbjni)
$(call import-module,fb)
$(call import-module,folly)
$(call import-module,react/renderer/componentregistry)
$(call import-module,react/renderer/core)
$(call import-module,react/renderer/attributedstring)
$(call import-module,react/renderer/debug)
$(call import-module,react/renderer/graphics)
$(call import-module,react/renderer/uimanager)
$(call import-module,react/utils)
$(call import-module,yogajni)
