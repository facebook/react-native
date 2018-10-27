LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := reactnative

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/..
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_INCLUDES)

LOCAL_CFLAGS := \
  -DLOG_TAG=\"ReactNative\"

LOCAL_CFLAGS += -fexceptions -frtti

LOCAL_STATIC_LIBRARIES := boost
LOCAL_SHARED_LIBRARIES := jsinspector libfolly_json glog

include $(BUILD_STATIC_LIBRARY)

$(call import-module,fb)
$(call import-module,folly)
$(call import-module,jsc)
$(call import-module,glog)
$(call import-module,jsinspector)
