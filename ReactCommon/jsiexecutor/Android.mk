LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := jsireact

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/jsireact/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := -fexceptions -frtti -O3

LOCAL_STATIC_LIBRARIES := libjsi reactnative
LOCAL_SHARED_LIBRARIES := libfolly_json glog

include $(BUILD_STATIC_LIBRARY)
