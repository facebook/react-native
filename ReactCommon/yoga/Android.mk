LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := yogacore

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/yoga/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := -fexceptions -frtti -O3

include $(BUILD_STATIC_LIBRARY)
