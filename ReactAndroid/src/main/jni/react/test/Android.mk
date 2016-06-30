LOCAL_PATH:= $(call my-dir)

include $(CLEAR_VARS)

LOCAL_SRC_FILES:= \
	jscexecutor.cpp \
	jsclogging.cpp \
	value.cpp \
	methodcall.cpp \

LOCAL_SHARED_LIBRARIES := \
	libfb \
	libreactnative \
  libjsc

LOCAL_STATIC_LIBRARIES := \
	libgoogletest

LOCAL_MODULE := reactnative_test

LOCAL_CFLAGS += $(BUCK_DEP_CFLAGS)
LOCAL_LDFLAGS += $(BUCK_DEP_LDFLAGS)

include $(BUILD_EXECUTABLE)

$(call import-module,react)
