LOCAL_PATH:= $(call my-dir)
include $(CLEAR_VARS)

LOCAL_SRC_FILES:= \
       Countable.cpp \
       Environment.cpp \
       fbjni.cpp \
       jni_helpers.cpp \
       LocalString.cpp \
       OnLoad.cpp \
       WeakReference.cpp \
       fbjni/Exceptions.cpp \
       fbjni/Hybrid.cpp \
       fbjni/References.cpp

LOCAL_C_INCLUDES := $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/..

LOCAL_CFLAGS := -DLOG_TAG=\"fbjni\" -fexceptions -frtti
LOCAL_CFLAGS += -Wall -Werror

CXX11_FLAGS := -std=gnu++11
LOCAL_CFLAGS += $(CXX11_FLAGS)

LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)

LOCAL_LDLIBS := -landroid

LOCAL_SHARED_LIBRARIES := libfb

LOCAL_MODULE := libfbjni

include $(BUILD_SHARED_LIBRARY)

$(call import-module,fb)
