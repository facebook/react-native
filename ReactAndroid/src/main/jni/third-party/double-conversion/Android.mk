LOCAL_PATH:= $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := double-conversion

LOCAL_SRC_FILES := \
  double-conversion/bignum.cc \
  double-conversion/bignum-dtoa.cc \
  double-conversion/cached-powers.cc \
  double-conversion/diy-fp.cc \
  double-conversion/double-conversion.cc \
  double-conversion/fast-dtoa.cc \
  double-conversion/fixed-dtoa.cc \
  double-conversion/strtod.cc

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

CXX11_FLAGS := -Wno-unused-variable -Wno-unused-local-typedefs
LOCAL_CFLAGS += $(CXX11_FLAGS)

include $(BUILD_STATIC_LIBRARY)