LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

# Flag to enable V8 in react-native code
V8_ENABLED := 1

LOCAL_MODULE := reactnativejni

LOCAL_SRC_FILES := \
  CatalystInstanceImpl.cpp \
  CxxModuleWrapper.cpp \
  InstanceManager.cpp \
  JavaModuleWrapper.cpp \
  JReactMarker.cpp \
  JSLogging.cpp \
  JMessageQueueThread.cpp \
  JSLoader.cpp \
  JniJSModulesUnbundle.cpp \
  MethodInvoker.cpp \
  ModuleRegistryBuilder.cpp \
  NativeArray.cpp \
  NativeCommon.cpp \
  NativeDeltaClient.cpp \
  NativeMap.cpp \
  OnLoad.cpp \
  ProxyExecutor.cpp \
  ReadableNativeArray.cpp \
  ReadableNativeMap.cpp \
  WritableNativeArray.cpp \
  WritableNativeMap.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../..

LOCAL_CFLAGS += -fvisibility=hidden
LOCAL_CXXFLAGS := -fexceptions -frtti

LOCAL_LDLIBS += -landroid
LOCAL_SHARED_LIBRARIES := libfolly_json libfb libglog_init libyoga libprivatedata

LOCAL_V8_FILES := \
  AndroidV8Factory.cpp

LOCAL_JSC_FILES := \
  AndroidJSCFactory.cpp \
  JSCPerfLogging.cpp \
  JSLogging.cpp

ifeq ($(V8_ENABLED), 1)
  LOCAL_SRC_FILES += $(LOCAL_V8_FILES)
  LOCAL_CFLAGS += -DV8_ENABLED=1
else
  LOCAL_SRC_FILES += $(LOCAL_JSC_FILES)
  LOCAL_CFLAGS += -DV8_ENABLED=0
  LOCAL_SHARED_LIBRARIES += libjsc
endif

LOCAL_STATIC_LIBRARIES := libreactnative
APP_ALLOW_MISSING_DEPS :=true

include $(BUILD_SHARED_LIBRARY)

$(call import-module,cxxreact)
$(call import-module,privatedata)
$(call import-module,fb)
$(call import-module,fbgloginit)
$(call import-module,folly)
ifeq ($(V8_ENABLED), 0)
  $(call import-module,jsc)
endif
$(call import-module,yogajni)
$(call import-module,jsi)
$(call import-module,jsiexecutor)

# TODO(ramanpreet):
#   Why doesn't this import-module call generate a jscexecutor.so file?
# $(call import-module,jscexecutor)

include $(REACT_SRC_DIR)/jscexecutor/Android.mk
include $(REACT_SRC_DIR)/v8executor/Android.mk
