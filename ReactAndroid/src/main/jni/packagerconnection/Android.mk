LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := packagerconnectionjnifb

LOCAL_SRC_FILES := \
  JSPackagerClientResponder.h \
  SamplingProfilerPackagerMethod.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_C_INCLUDES := $(LOCAL_PATH)/../../

LOCAL_CFLAGS += -Wall -Werror -fvisibility=hidden -fexceptions -frtti
CXX11_FLAGS := -std=c++11
LOCAL_CFLAGS += $(CXX11_FLAGS)
LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)

LOCAL_LDLIBS += -landroid
LOCAL_SHARED_LIBRARIES := libfolly_json libfbjni libjsc libglog_init

include $(BUILD_SHARED_LIBRARY)

$(call import-module,fb)
$(call import-module,jsc)
$(call import-module,folly)
$(call import-module,fbgloginit)
$(call import-module,jni)
$(call import-module,jscwrapper)
