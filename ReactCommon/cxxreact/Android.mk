# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := reactnative

LOCAL_SRC_FILES := \
  CxxNativeModule.cpp \
  Instance.cpp \
  JSBigString.cpp \
  JSBundleType.cpp \
  JSDeltaBundleClient.cpp \
  JSExecutor.cpp \
  JSIndexedRAMBundle.cpp \
  MethodCall.cpp \
  ModuleRegistry.cpp \
  NativeToJsBridge.cpp \
  Platform.cpp \
  RAMBundleRegistry.cpp \
  ReactMarker.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)/..  
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"

LOCAL_CFLAGS += -fexceptions -frtti -Wno-unused-lambda-capture -Wno-unused-variable

LOCAL_STATIC_LIBRARIES := boost jsi
LOCAL_SHARED_LIBRARIES := jsinspector libfb libfolly_json libglog 

LOCAL_V8_FILES := \
    File.cpp \
    V8NativeModules.cpp \
    V8Executor.cpp 
    
ifeq ($(JS_ENGINE), V8)
  LOCAL_SRC_FILES += $(LOCAL_V8_FILES)
  LOCAL_STATIC_LIBRARIES := v8helpers
  LOCAL_SHARED_LIBRARIES += libv8 libv8platform libv8base
endif

include $(BUILD_STATIC_LIBRARY)

$(call import-module,fb)
$(call import-module,folly)
$(call import-module,glog)
$(call import-module,jsi)
$(call import-module,jsinspector)
$(call import-module,privatedata)
ifeq ($(JS_ENGINE), V8)
  $(call import-module,v8)
  $(call import-module,v8base)
  $(call import-module,v8helpers) 
  $(call import-module,v8platform) 
endif