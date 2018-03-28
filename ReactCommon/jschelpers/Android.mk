LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := jschelpers

LOCAL_SRC_FILES := \
  JSCHelpers.cpp \
  Unicode.cpp \
  Value.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"

LOCAL_CFLAGS += -Wall -Werror -fexceptions -frtti
CXX11_FLAGS := -std=c++11
LOCAL_CFLAGS += $(CXX11_FLAGS)
LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)

LOCAL_SHARED_LIBRARIES := libfolly_json libjsc libglog

include $(BUILD_STATIC_LIBRARY)

$(call import-module,folly)
$(call import-module,jsc)
$(call import-module,glog)
$(call import-module,privatedata)
