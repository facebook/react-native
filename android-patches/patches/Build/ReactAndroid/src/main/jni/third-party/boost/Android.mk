--- ./ReactAndroid/src/main/jni/third-party/boost/Android.mk	2022-01-11 17:41:29.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/Build/ReactAndroid/src/main/jni/third-party/boost/Android.mk	2022-01-12 15:51:16.000000000 -0800
@@ -6,8 +6,8 @@
 # They are required for Folly futures to compile successfully.
 LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/asm/$(TARGET_ARCH)/*.S)
 
-LOCAL_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0
-LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0
+LOCAL_C_INCLUDES := $(LOCAL_PATH)/boost_1_68_0
+LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/boost_1_68_0
 
 LOCAL_MODULE := boost
 
