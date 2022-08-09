# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := mapbufferjni

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/react/common/mapbuffer/*.cpp)

LOCAL_SHARED_LIBRARIES := \
  libfb \
  libfbjni \
  libfolly_futures \
  libfolly_json \
  libglog \
  libglog_init \
  libreact_debug \
  libreact_render_mapbuffer \
  libreact_utils \
  libreact_config \
  libyoga

LOCAL_STATIC_LIBRARIES :=

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
$(call import-module,react/renderer/mapbuffer)
