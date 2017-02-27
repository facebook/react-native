LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := reactnativejnifb

LOCAL_SRC_FILES := \
  CatalystInstanceImpl.cpp \
  CxxModuleWrapper.cpp \
  JavaModuleWrapper.cpp \
  JExecutorToken.cpp \
  JMessageQueueThread.cpp \
  JniJSModulesUnbundle.cpp \
  JSCPerfLogging.cpp \
  JSLoader.cpp \
  JSLogging.cpp \
  MethodInvoker.cpp \
  OnLoad.cpp \
  ProxyExecutor.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_C_INCLUDES := $(LOCAL_PATH)/../../

LOCAL_CFLAGS += -Wall -Werror -fvisibility=hidden -fexceptions -frtti
CXX11_FLAGS := -std=c++11
LOCAL_CFLAGS += $(CXX11_FLAGS)
LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)

LOCAL_LDLIBS += -landroid
LOCAL_SHARED_LIBRARIES := libfolly_json libfbjni libjsc libglog_init libreactnativejni
LOCAL_STATIC_LIBRARIES := libreactnative libreactnativefb

include $(BUILD_SHARED_LIBRARY)

$(call import-module,cxxreact)
$(call import-module,jsc)
$(call import-module,folly)
$(call import-module,fbgloginit)
$(call import-module,jni)
$(call import-module,react)
