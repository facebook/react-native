LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := jsi

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES += $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := -fexceptions -frtti -O3
LOCAL_SHARED_LIBRARIES := libfolly_json libjsc glog

include $(BUILD_STATIC_LIBRARY)
