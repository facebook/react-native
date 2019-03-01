LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := v8helpers

LOCAL_SRC_FILES := \
  V8Utils.cpp \
 
LOCAL_C_INCLUDES := $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"

LOCAL_CFLAGS += -DV8_ENABLED=1

LOCAL_CXXFLAGS += -frtti -fexceptions 
LOCAL_CFLAGS += -Wall -Werror 
CXX14_FLAGS := -std=c++14
LOCAL_CFLAGS += $(CXX14_FLAGS)
LOCAL_EXPORT_CPPFLAGS := $(CXX14_FLAGS)

LOCAL_SHARED_LIBRARIES := libfolly_json libv8

include $(BUILD_STATIC_LIBRARY)

$(call import-module,folly)
$(call import-module,v8)
