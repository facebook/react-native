LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)

# These ASM files are picked from the boost release separately,
# because the react native version does not include anything outside of headers.
# They are required for Folly futures to compile successfully.
LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/asm/$(TARGET_ARCH_ABI)/*.S)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

LOCAL_C_INCLUDES := $(LOCAL_PATH)/boost_1_76_0
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/boost_1_76_0

LOCAL_MODULE := boost

include $(BUILD_STATIC_LIBRARY)
