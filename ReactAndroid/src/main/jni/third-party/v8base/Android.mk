LOCAL_PATH:= $(call my-dir)
include $(CLEAR_VARS)
include $(LOCAL_PATH)/../v8/base.mk
LOCAL_MODULE:= v8base
LOCAL_SRC_FILES := $(LIB_PATH)/libv8_libbase.cr.so
include $(PREBUILT_SHARED_LIBRARY)