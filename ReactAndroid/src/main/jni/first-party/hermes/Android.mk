LOCAL_PATH:= $(call my-dir)
include $(CLEAR_VARS)
LOCAL_MODULE:= hermes
LOCAL_SRC_FILES := jni/$(TARGET_ARCH_ABI)/libhermes.so
include $(PREBUILT_SHARED_LIBRARY)
