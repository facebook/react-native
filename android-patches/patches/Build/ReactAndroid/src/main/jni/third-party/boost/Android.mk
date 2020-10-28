--- "E:\\github\\rnm-63-fresh\\ReactAndroid\\src\\main\\jni\\third-party\\boost\\Android.mk"	2020-10-27 20:26:17.038172200 -0700
+++ "E:\\github\\rnm-63\\ReactAndroid\\src\\main\\jni\\third-party\\boost\\Android.mk"	2020-10-13 21:52:15.163202200 -0700
@@ -1,8 +1,8 @@
 LOCAL_PATH:= $(call my-dir)
 include $(CLEAR_VARS)
 
-LOCAL_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0
-LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0
+LOCAL_C_INCLUDES := $(LOCAL_PATH)/boost_1_68_0
+LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/boost_1_68_0
 
 LOCAL_MODULE    := boost
 
