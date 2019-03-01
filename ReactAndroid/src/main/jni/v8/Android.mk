LOCAL_PATH:= $(call my-dir)
include $(CLEAR_VARS)
include $(LOCAL_PATH)/base.mk
LOCAL_MODULE := v8
LOCAL_SRC_FILES := $(LIB_PATH)/libv8.cr.so
LOCAL_EXPORT_C_INCLUDES := $(V8_NUGET_DIR)/headers/include
include $(PREBUILT_SHARED_LIBRARY)