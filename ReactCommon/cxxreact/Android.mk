# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := reactnative

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"

LOCAL_CFLAGS += -fexceptions -frtti -Wno-unused-lambda-capture

LOCAL_STATIC_LIBRARIES := boost jsi callinvoker reactperflogger runtimeexecutor
LOCAL_SHARED_LIBRARIES := jsinspector libfolly_json glog logger

include $(BUILD_STATIC_LIBRARY)

$(call import-module,fb)
$(call import-module,folly)
$(call import-module,callinvoker)
$(call import-module,reactperflogger)
$(call import-module,jsc)
$(call import-module,glog)
$(call import-module,jsi)
$(call import-module,jsinspector)
$(call import-module,hermes/inspector)
$(call import-module,hermes/executor)
$(call import-module,logger)
