LOCAL_PATH:= $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := libreactnative

LOCAL_SRC_FILES := \
  Bridge.cpp \
  JSCExecutor.cpp \
  JSCHelpers.cpp \
  JSCWebWorker.cpp \
  JSModulesUnbundle.cpp \
  MethodCall.cpp \
  Value.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"

LOCAL_CFLAGS += -Wall -Werror -fexceptions
CXX11_FLAGS := -std=c++11
LOCAL_CFLAGS += $(CXX11_FLAGS)
LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)

LOCAL_SHARED_LIBRARIES := libfb libfbjni libfolly_json libjsc

include $(BUILD_STATIC_LIBRARY)

$(call import-module,fb)
$(call import-module,jni)
$(call import-module,folly)
$(call import-module,jsc)
