LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := libreactnative

LOCAL_SRC_FILES := \
  Bridge.cpp \
  JSCExecutor.cpp \
  JSCHelpers.cpp \
  MethodCall.cpp \
  Platform.cpp \
  Value.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"

LOCAL_CFLAGS += -Wall -Werror -fexceptions -frtti
LOCAL_CPPFLAGS := -std=c++1y
LOCAL_EXPORT_CPPFLAGS := $(LOCAL_CPPFLAGS)

LOCAL_SHARED_LIBRARIES := libfb libfolly_json libjsc libglog

include $(BUILD_STATIC_LIBRARY)

$(call import-module,fb)
$(call import-module,folly)
$(call import-module,jsc)
$(call import-module,glog)
