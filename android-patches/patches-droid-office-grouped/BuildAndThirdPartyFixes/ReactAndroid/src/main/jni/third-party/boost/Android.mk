--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\third-party\\boost\\Android.mk"	2020-01-29 14:11:26.493527900 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\third-party\\boost\\Android.mk"	2020-02-19 13:19:36.173821500 -0800
@@ -1,8 +1,8 @@
 LOCAL_PATH:= $(call my-dir)
 include $(CLEAR_VARS)
 
-LOCAL_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0
-LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0
+LOCAL_C_INCLUDES := $(LOCAL_PATH)
+LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)
 
 LOCAL_MODULE    := boost
 
