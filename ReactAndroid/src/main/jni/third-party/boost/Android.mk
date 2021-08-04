LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)

# These ASM files are picked from the boost release separately,
# because the react native version does not include anything outside of headers.
# They are required for Folly futures to compile successfully.
LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/asm/$(TARGET_ARCH)/*.S)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0

LOCAL_MODULE := boost

include $(BUILD_STATIC_LIBRARY)
