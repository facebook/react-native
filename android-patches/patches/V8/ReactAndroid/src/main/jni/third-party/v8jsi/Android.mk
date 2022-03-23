diff --git a/ReactAndroid/src/main/jni/third-party/v8jsi/Android.mk b/ReactAndroid/src/main/jni/third-party/v8jsi/Android.mk
new file mode 100644
index 0000000000..ca299e0278
--- /dev/null
+++ b/ReactAndroid/src/main/jni/third-party/v8jsi/Android.mk
@@ -0,0 +1,17 @@
+LOCAL_PATH:= $(call my-dir)
+include $(CLEAR_VARS)
+
+ifeq ($(TARGET_ARCH_ABI),armeabi-v7a)
+  LIB_PATH := $(V8_NUGET_DIR)/lib/droidarm/ship/x-none
+else ifeq ($(TARGET_ARCH_ABI),x86)
+  LIB_PATH := $(V8_NUGET_DIR)/lib/droidx86/ship/x-none
+else ifeq ($(TARGET_ARCH_ABI), arm64-v8a)
+  LIB_PATH := $(V8_NUGET_DIR)/lib/droidarm64/ship/x-none
+else ifeq ($(TARGET_ARCH_ABI), x86_64)
+  LIB_PATH := $(V8_NUGET_DIR)/lib/droidx64/ship/x-none
+endif
+
+LOCAL_MODULE := v8jsi
+LOCAL_SRC_FILES := $(LIB_PATH)/libv8jsi.so
+LOCAL_EXPORT_C_INCLUDES := $(V8_NUGET_DIR)/headers
+include $(PREBUILT_SHARED_LIBRARY)
\ No newline at end of file
