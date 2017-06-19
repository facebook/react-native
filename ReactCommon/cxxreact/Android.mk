LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := reactnative

LOCAL_SRC_FILES := \
  CxxNativeModule.cpp \
  Instance.cpp \
  JSCExecutor.cpp \
  JSBigString.cpp \
  JSBundleType.cpp \
  JSCLegacyProfiler.cpp \
  JSCLegacyTracing.cpp \
  JSCMemory.cpp \
  JSCNativeModules.cpp \
  JSCPerfStats.cpp \
  JSCTracing.cpp \
  JSIndexedRAMBundle.cpp \
  MethodCall.cpp \
  ModuleRegistry.cpp \
  NativeToJsBridge.cpp \
  Platform.cpp \
	JSCUtils.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"

LOCAL_CFLAGS += -Wall -Werror -fexceptions -frtti
CXX11_FLAGS := -std=c++11
LOCAL_CFLAGS += $(CXX11_FLAGS)
LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)

LOCAL_STATIC_LIBRARIES := jschelpers
LOCAL_SHARED_LIBRARIES := libfb libfolly_json libjsc libglog

include $(BUILD_STATIC_LIBRARY)

$(call import-module,fb)
$(call import-module,folly)
$(call import-module,jsc)
$(call import-module,glog)
$(call import-module,jschelpers)
