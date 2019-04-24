LOCAL_PATH:= $(call my-dir)

include $(CLEAR_VARS)

LOCAL_SRC_FILES := \
  glog/src/demangle.cc \
  glog/src/logging.cc \
  glog/src/raw_logging.cc \
  glog/src/signalhandler.cc \
  glog/src/symbolize.cc \
  glog/src/utilities.cc \
  glog/src/vlog_is_on.cc

LOCAL_C_INCLUDES += $(LOCAL_PATH) $(LOCAL_PATH)/.. $(LOCAL_PATH)/glog/src/

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/exported

LOCAL_CFLAGS += \
  -Wno-unused-variable \
  -Wno-unused-function \
  -Wwrite-strings \
  -Woverloaded-virtual \
  -Wno-sign-compare \
  -DNDEBUG \
  -g \
  -O2 \
  -D_START_GOOGLE_NAMESPACE_="namespace google {" \
  -D_END_GOOGLE_NAMESPACE_="}"


LOCAL_MODULE := glog

include $(BUILD_SHARED_LIBRARY)
