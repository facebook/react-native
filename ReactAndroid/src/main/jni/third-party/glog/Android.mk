LOCAL_PATH:= $(call my-dir)

include $(CLEAR_VARS)

LOCAL_SRC_FILES := \
  glog-0.3.5/src/demangle.cc \
  glog-0.3.5/src/logging.cc \
  glog-0.3.5/src/raw_logging.cc \
  glog-0.3.5/src/signalhandler.cc \
  glog-0.3.5/src/symbolize.cc \
  glog-0.3.5/src/utilities.cc \
  glog-0.3.5/src/vlog_is_on.cc

LOCAL_C_INCLUDES += $(LOCAL_PATH) $(LOCAL_PATH)/.. $(LOCAL_PATH)/glog-0.3.5/src/

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/exported

LOCAL_CFLAGS += \
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
