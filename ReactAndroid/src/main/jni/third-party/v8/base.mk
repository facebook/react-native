# This file will be included by all V8 bin modules.
# It provides the relative path of V8 bin to the V8 nuget based upon the architecture.
ifeq ($(TARGET_ARCH_ABI),armeabi-v7a)
  LIB_PATH := $(V8_NUGET_DIR)/droidarm/ship/x-none
else ifeq ($(TARGET_ARCH_ABI),x86)
  LIB_PATH := $(V8_NUGET_DIR)/droidx86/ship/x-none
else ifeq ($(TARGET_ARCH_ABI), arm64-v8a)
  LIB_PATH := $(V8_NUGET_DIR)/droidarm64/ship/x-none
else ifeq ($(TARGET_ARCH_ABI), x86_64)
  LIB_PATH := $(V8_NUGET_DIR)/droidx64/ship/x-none
endif