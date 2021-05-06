# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_render_uimanager

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../../../

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

LOCAL_STATIC_LIBRARIES :=

LOCAL_SHARED_LIBRARIES := libreact_render_graphics libfolly_futures libruntimeexecutor libreact_render_componentregistry glog libreactconfig libfolly_json libjsi libreact_render_core libreact_render_debug librrc_view librrc_root libreact_render_mounting libreact_debug libreact_render_leakchecker

include $(BUILD_SHARED_LIBRARY)

$(call import-module,glog)
$(call import-module,jsi)
$(call import-module,folly)
$(call import-module,react/config)
$(call import-module,react/renderer/components/root)
$(call import-module,react/renderer/components/view)
$(call import-module,react/renderer/componentregistry)
$(call import-module,react/renderer/core)
$(call import-module,react/renderer/leakchecker)
$(call import-module,react/renderer/debug)
$(call import-module,react/renderer/graphics)
$(call import-module,react/renderer/mounting)
$(call import-module,react/debug)
$(call import-module,runtimeexecutor)
