LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := jsinspector

LOCAL_SRC_FILES := \
  InspectorInterfaces.cpp

LOCAL_C_INCLUDES := $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS += -fexceptions

include $(BUILD_SHARED_LIBRARY)
