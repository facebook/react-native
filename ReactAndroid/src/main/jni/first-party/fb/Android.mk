LOCAL_PATH:= $(call my-dir)
include $(CLEAR_VARS)

LOCAL_SRC_FILES:= \
       assert.cpp \
       log.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)/.. $(LOCAL_PATH)/include
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/.. $(LOCAL_PATH)/include

LOCAL_CFLAGS := -DLOG_TAG=\"libfb\"
LOCAL_CFLAGS += -Wall -Werror
# include/utils/threads.h has unused parameters
LOCAL_CFLAGS += -Wno-unused-parameter
ifeq ($(TOOLCHAIN_PERMISSIVE),true)
  LOCAL_CFLAGS += -Wno-error=unused-but-set-variable
endif
LOCAL_CFLAGS += -DHAVE_POSIX_CLOCKS

CXX11_FLAGS := -std=c++11
LOCAL_CFLAGS += $(CXX11_FLAGS)

LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)

LOCAL_LDLIBS := -llog -ldl -landroid
LOCAL_EXPORT_LDLIBS := -llog

LOCAL_MODULE := libfb

include $(BUILD_SHARED_LIBRARY)