LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := fmt

LOCAL_SRC_FILES := \
  src/format.cc

LOCAL_C_INCLUDES := $(LOCAL_PATH)/include/
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/

LOCAL_CFLAGS += -std=c++11 -fexceptions

include $(BUILD_STATIC_LIBRARY)
