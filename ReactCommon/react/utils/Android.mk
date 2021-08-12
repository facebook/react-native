# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_utils

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH) $(LOCAL_PATH)/../../
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../../

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

LOCAL_STATIC_LIBRARIES :=
LOCAL_SHARED_LIBRARIES := libreact_debug libreact_render_mapbuffer libglog libglog_init

include $(BUILD_SHARED_LIBRARY)

$(call import-module,react/debug)
$(call import-module,fbgloginit)
$(call import-module,glog)
$(call import-module,react/renderer/mapbuffer)
