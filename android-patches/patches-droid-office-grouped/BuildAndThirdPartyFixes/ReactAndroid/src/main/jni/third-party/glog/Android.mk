--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\third-party\\glog\\Android.mk"	2020-01-29 14:11:26.494528400 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\third-party\\glog\\Android.mk"	2020-02-19 13:19:36.174853600 -0800
@@ -3,19 +3,21 @@
 include $(CLEAR_VARS)
 
 LOCAL_SRC_FILES := \
-  glog-0.3.5/src/demangle.cc \
-  glog-0.3.5/src/logging.cc \
-  glog-0.3.5/src/raw_logging.cc \
-  glog-0.3.5/src/signalhandler.cc \
-  glog-0.3.5/src/symbolize.cc \
-  glog-0.3.5/src/utilities.cc \
-  glog-0.3.5/src/vlog_is_on.cc
+  glog/src/demangle.cc \
+  glog/src/logging.cc \
+  glog/src/raw_logging.cc \
+  glog/src/signalhandler.cc \
+  glog/src/symbolize.cc \
+  glog/src/utilities.cc \
+  glog/src/vlog_is_on.cc
 
-LOCAL_C_INCLUDES += $(LOCAL_PATH) $(LOCAL_PATH)/.. $(LOCAL_PATH)/glog-0.3.5/src/
+LOCAL_C_INCLUDES += $(LOCAL_PATH) $(LOCAL_PATH)/.. $(LOCAL_PATH)/glog/src/
 
 LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/exported
 
 LOCAL_CFLAGS += \
+  -Wno-unused-variable \
+  -Wno-unused-function \
   -Wwrite-strings \
   -Woverloaded-virtual \
   -Wno-sign-compare \
