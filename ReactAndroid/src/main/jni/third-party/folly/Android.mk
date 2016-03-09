LOCAL_PATH:= $(call my-dir)
include $(CLEAR_VARS)

LOCAL_SRC_FILES:= \
	folly/json.cpp \
	folly/Unicode.cpp \
	folly/Conv.cpp \
  folly/detail/FunctionalExcept.cpp \
  folly/detail/MallocImpl.cpp \
  folly/Malloc.cpp \
  folly/StringBase.cpp \
  folly/dynamic.cpp \

LOCAL_C_INCLUDES := $(LOCAL_PATH)
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS += -fexceptions -fno-omit-frame-pointer -frtti
LOCAL_CFLAGS += -Wall -Werror -std=c++11

CXX11_FLAGS := -std=gnu++11
LOCAL_CFLAGS += $(CXX11_FLAGS)

FOLLY_FLAGS := -DFOLLY_NO_CONFIG=1 -DFOLLY_HAVE_CLOCK_GETTIME=1
LOCAL_CFLAGS += $(FOLLY_FLAGS)

LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS) $(FOLLY_FLAGS)

LOCAL_MODULE := libfolly_json

LOCAL_SHARED_LIBRARIES := libglog libdouble-conversion
# Boost is header-only library we pretend to link is statically as
# this way android makefile will automatically setup path to boost header
# file, but except from that this will have no effect, as no c/cpp files
# are part of this static library
LOCAL_STATIC_LIBRARIES := libboost

include $(BUILD_SHARED_LIBRARY)

$(call import-module,glog)
$(call import-module,double-conversion)
$(call import-module,boost)
