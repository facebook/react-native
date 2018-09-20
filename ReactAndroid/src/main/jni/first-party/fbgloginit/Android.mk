LOCAL_PATH:= $(call my-dir)
include $(CLEAR_VARS)

LOCAL_SRC_FILES:= \
       glog_init.cpp

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS := -fexceptions -fno-omit-frame-pointer

LOCAL_LDLIBS := -llog

LOCAL_SHARED_LIBRARIES := libglog

LOCAL_MODULE := libglog_init

include $(BUILD_SHARED_LIBRARY)
