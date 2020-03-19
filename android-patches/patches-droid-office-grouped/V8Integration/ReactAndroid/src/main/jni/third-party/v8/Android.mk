--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\third-party\\v8\\Android.mk"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\third-party\\v8\\Android.mk"	2020-01-29 14:10:09.688894200 -0800
@@ -0,0 +1,7 @@
+LOCAL_PATH:= $(call my-dir)
+include $(CLEAR_VARS)
+include $(LOCAL_PATH)/base.mk
+LOCAL_MODULE := v8
+LOCAL_SRC_FILES := $(LIB_PATH)/libv8.cr.so
+LOCAL_EXPORT_C_INCLUDES := $(V8_NUGET_DIR)/headers/include
+include $(PREBUILT_SHARED_LIBRARY)
\ No newline at end of file
