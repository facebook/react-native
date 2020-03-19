--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\Application.mk"	2020-01-30 13:55:48.459617000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\Application.mk"	2020-02-20 11:21:17.373512500 -0800
@@ -22,7 +22,7 @@
 # Where are APP_MK_DIR, THIRD_PARTY_NDK_DIR, etc. defined?
 #   The directories inside NDK_MODULE_PATH (ex: APP_MK_DIR, THIRD_PARTY_NDK_DIR,
 #   etc.) are defined inside build.gradle.
-NDK_MODULE_PATH := $(APP_MK_DIR)$(HOST_DIRSEP)$(THIRD_PARTY_NDK_DIR)$(HOST_DIRSEP)$(REACT_COMMON_DIR)$(HOST_DIRSEP)$(APP_MK_DIR)first-party$(HOST_DIRSEP)$(REACT_SRC_DIR)
+NDK_MODULE_PATH := $(APP_MK_DIR)$(HOST_DIRSEP)$(THIRD_PARTY_NDK_DIR)$(HOST_DIRSEP)$(REACT_COMMON_DIR)$(HOST_DIRSEP)$(APP_MK_DIR)first-party$(HOST_DIRSEP)$(THIRD_PARTY_NDK_SRC_DIR)$(HOST_DIRSEP)
 
 APP_STL := c++_shared
 
@@ -31,4 +31,4 @@
 APP_CPPFLAGS := -std=c++1y
 APP_LDFLAGS := -Wl,--build-id
 
-NDK_TOOLCHAIN_VERSION := clang
+NDK_TOOLCHAIN_VERSION := clang
\ No newline at end of file
