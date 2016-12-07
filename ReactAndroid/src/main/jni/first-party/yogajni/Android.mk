LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := yoga

LOCAL_SRC_FILES := \
  jni/YGJNI.cpp

LOCAL_C_INCLUDES := $(LOCAL_PATH)/jni

LOCAL_CFLAGS += -Wall -Werror -fvisibility=hidden -fexceptions -frtti -O3
CXX11_FLAGS := -std=c++11
LOCAL_CFLAGS += $(CXX11_FLAGS)
LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)

LOCAL_LDLIBS += -landroid -llog
LOCAL_STATIC_LIBRARIES := libyogacore
LOCAL_SHARED_LIBRARIES := libfb

include $(BUILD_SHARED_LIBRARY)

$(call import-module,yoga)
$(call import-module,fb)
