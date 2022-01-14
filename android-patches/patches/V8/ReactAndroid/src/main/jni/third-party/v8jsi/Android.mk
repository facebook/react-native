--- /dev/null	2022-01-12 17:14:59.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/V8/ReactAndroid/src/main/jni/third-party/v8jsi/Android.mk	2022-01-12 15:04:31.000000000 -0800
@@ -0,0 +1,17 @@
+LOCAL_PATH:= $(call my-dir)
+include $(CLEAR_VARS)
+
+ifeq ($(TARGET_ARCH_ABI),armeabi-v7a)
+  LIB_PATH := $(V8_NUGET_DIR)/droidarm/ship/x-none
+else ifeq ($(TARGET_ARCH_ABI),x86)
+  LIB_PATH := $(V8_NUGET_DIR)/droidx86/ship/x-none
+else ifeq ($(TARGET_ARCH_ABI), arm64-v8a)
+  LIB_PATH := $(V8_NUGET_DIR)/droidarm64/ship/x-none
+else ifeq ($(TARGET_ARCH_ABI), x86_64)
+  LIB_PATH := $(V8_NUGET_DIR)/droidx64/ship/x-none
+endif
+
+LOCAL_MODULE := v8jsi
+LOCAL_SRC_FILES := $(LIB_PATH)/libv8jsi.so
+LOCAL_EXPORT_C_INCLUDES := $(V8_NUGET_DIR)/headers/include
+include $(PREBUILT_SHARED_LIBRARY)
\ No newline at end of file
