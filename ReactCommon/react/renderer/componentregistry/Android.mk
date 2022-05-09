# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_render_componentregistry

LOCAL_C_INCLUDES := $(LOCAL_PATH)/../../../

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../../../

LOCAL_SHARED_LIBRARIES := \
  libfolly_futures \
  libfolly_json \
  libglog_init \
  libjsi \
  libreact_debug \
  libreact_render_core \
  libreact_render_debug \
  libreact_utils

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

include $(BUILD_SHARED_LIBRARY)

$(call import-module,fbgloginit)
$(call import-module,folly)
$(call import-module,jsi)
$(call import-module,react/renderer/core)
$(call import-module,react/renderer/debug)
$(call import-module,react/utils)
$(call import-module,react/debug)
