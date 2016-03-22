LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := reactnativejni

LOCAL_SRC_FILES := \
	JExecutorToken.cpp \
  JMessageQueueThread.cpp \
  JSCPerfLogging.cpp \
  JSLoader.cpp \
  JSLogging.cpp \
  JniJSModulesUnbundle.cpp \
  NativeArray.cpp \
  OnLoad.cpp \
  ProxyExecutor.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS := -Wall -Werror -fvisibility=hidden -fexceptions -frtti
LOCAL_CPPFLAGS := -std=c++1y
LOCAL_EXPORT_CPPFLAGS := $(LOCAL_CPPFLAGS)

LOCAL_LDLIBS += -landroid
LOCAL_SHARED_LIBRARIES := libfolly_json libfbjni libjsc libglog_init
LOCAL_STATIC_LIBRARIES := libreactnative

include $(BUILD_SHARED_LIBRARY)

$(call import-module,react)
$(call import-module,jsc)
$(call import-module,folly)
$(call import-module,fbgloginit)
$(call import-module,jni)
$(call import-module,jsc)
