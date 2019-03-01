LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := packagerconnectionjnifb

LOCAL_SRC_FILES := \
  JSPackagerClientResponder.h \
  SamplingProfilerPackagerMethod.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_C_INCLUDES := $(LOCAL_PATH)/../../

LOCAL_CXXFLAGS = -frtti -fexceptions 
LOCAL_CFLAGS += -Wall -Werror -fvisibility=hidden 
CXX14_FLAGS := -std=c++14
LOCAL_CFLAGS += $(CXX14_FLAGS)
LOCAL_EXPORT_CPPFLAGS := $(CXX14_FLAGS)

LOCAL_LDLIBS += -landroid
LOCAL_SHARED_LIBRARIES := libfolly_json libfbjni libglog_init

include $(BUILD_SHARED_LIBRARY)

$(call import-module,fb)
$(call import-module,folly)
$(call import-module,fbgloginit)
$(call import-module,jni)