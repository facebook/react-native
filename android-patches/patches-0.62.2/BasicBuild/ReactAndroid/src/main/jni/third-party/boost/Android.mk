--- /home/mganandraj/code/rn-macos-fb62merge-fresh/ReactAndroid/src/main/jni/third-party/boost/Android.mk	2020-08-17 18:02:35.490031483 -0700
+++ /home/mganandraj/code/rn-macos-fb62merge/ReactAndroid/src/main/jni/third-party/boost/Android.mk	2020-08-17 15:12:14.706279608 -0700
@@ -1,8 +1,8 @@
 LOCAL_PATH:= $(call my-dir)
 include $(CLEAR_VARS)
 
-LOCAL_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0
-LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0
+LOCAL_C_INCLUDES := $(LOCAL_PATH)/boost_1_68_0
+LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/boost_1_68_0
 
 LOCAL_MODULE    := boost
 
