# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_render_components_slider

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp) $(wildcard $(LOCAL_PATH)/platform/android/react/renderer/components/slider/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/ $(LOCAL_PATH)/platform/android/
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../../../../ $(LOCAL_PATH)/platform/android/

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++14 -Wall

LOCAL_STATIC_LIBRARIES :=

LOCAL_SHARED_LIBRARIES := libfbjni libreact_render_viewmanagers libreact_render_imagemanager libreactnativeutilsjni libreact_render_componentregistry libreact_render_uimanager libreact_render_components_image libyoga libfolly_futures glog libfolly_json libglog_init libreact_render_core libreact_render_debug libreact_render_graphics libreact_render_components_view

include $(BUILD_SHARED_LIBRARY)

$(call import-module,fbjni)
$(call import-module,folly)
$(call import-module,fbgloginit)
$(call import-module,glog)
$(call import-module,react/renderer/componentregistry)
$(call import-module,react/renderer/core)
$(call import-module,react/renderer/debug)
$(call import-module,react/renderer/graphics)
$(call import-module,react/renderer/imagemanager)
$(call import-module,react/renderer/components/image)
$(call import-module,react/renderer/components/view)
$(call import-module,react/renderer/uimanager)
$(call import-module,yogajni)
