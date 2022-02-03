diff --git a/ReactAndroid/Android-prebuilt.mk b/ReactAndroid/Android-prebuilt.mk
index 18f8c26620..1e5afe5751 100644
--- a/ReactAndroid/Android-prebuilt.mk
+++ b/ReactAndroid/Android-prebuilt.mk
@@ -34,7 +34,7 @@ include $(CLEAR_VARS)
 LOCAL_MODULE := folly_json
 LOCAL_SRC_FILES := $(REACT_NDK_EXPORT_DIR)/$(TARGET_ARCH_ABI)/libfolly_json.so
 LOCAL_EXPORT_C_INCLUDES := \
-  $(THIRD_PARTY_NDK_DIR)/boost/boost_1_63_0 \
+  $(THIRD_PARTY_NDK_DIR)/boost/boost_1_68_0 \
   $(THIRD_PARTY_NDK_DIR)/double-conversion \
   $(THIRD_PARTY_NDK_DIR)/folly
 # Note: Sync with folly/Android.mk.
