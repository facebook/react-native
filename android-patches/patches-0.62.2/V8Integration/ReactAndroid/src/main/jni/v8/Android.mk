--- "D:\\code\\work\\rn-62-db\\ReactAndroid\\src\\main\\jni\\v8\\Android.mk"	1969-12-31 16:00:00.000000000 -0800
+++ "D:\\code\\work\\rn-62-d\\ReactAndroid\\src\\main\\jni\\v8\\Android.mk"	2020-04-30 15:30:04.511428600 -0700
@@ -0,0 +1,7 @@
+LOCAL_PATH:= $(call my-dir)
+include $(CLEAR_VARS)
+include $(LOCAL_PATH)/base.mk
+LOCAL_MODULE := v8
+LOCAL_SRC_FILES := $(LIB_PATH)/libv8.cr.so
+LOCAL_EXPORT_C_INCLUDES := $(V8_NUGET_DIR)/headers/include
+include $(PREBUILT_SHARED_LIBRARY)
\ No newline at end of file
