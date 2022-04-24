# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_render_telemetry

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../../../

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

LOCAL_STATIC_LIBRARIES :=

LOCAL_SHARED_LIBRARIES := \
  glog \
  libbutter \
  libfolly_futures \
  libfolly_json \
  libglog_init \
  libreact_debug \
  libreact_render_core \
  libreact_render_debug \
  libreact_utils \
  librrc_root \
  librrc_view \
  libyoga

include $(BUILD_SHARED_LIBRARY)

$(call import-module,butter)
$(call import-module,glog)
$(call import-module,folly)
$(call import-module,react/utils)
