LOCAL_PATH:= $(call my-dir)
include $(CLEAR_VARS)
include $(LOCAL_PATH)/../v8/base.mk
LOCAL_MODULE:= v8platform
LOCAL_SRC_FILES := $(LIB_PATH)/libv8_libplatform.cr.so
include $(PREBUILT_SHARED_LIBRARY)