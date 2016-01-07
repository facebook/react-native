LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := reactnativejni

LOCAL_SRC_FILES := \
  OnLoad.cpp \
  ProxyExecutor.cpp \
  NativeArray.cpp \
  JSLoader.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS += -Wall -Werror -fvisibility=hidden -fexceptions -frtti
CXX11_FLAGS := -std=c++11
LOCAL_CFLAGS += $(CXX11_FLAGS)
LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)

LOCAL_LDLIBS += -landroid
LOCAL_SHARED_LIBRARIES := libfolly_json libfbjni libjsc
LOCAL_STATIC_LIBRARIES := libreactnative

include $(BUILD_SHARED_LIBRARY)

$(call import-module,react)
$(call import-module,jsc)
$(call import-module,folly)
$(call import-module,jni)
$(call import-module,jsc)