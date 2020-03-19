--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\third-party\\folly\\Android.mk"	2020-01-30 13:55:48.490581300 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\third-party\\folly\\Android.mk"	2020-02-19 13:19:36.174853600 -0800
@@ -26,7 +26,7 @@
   -DFOLLY_NO_CONFIG=1 \
   -DFOLLY_HAVE_CLOCK_GETTIME=1 \
   -DFOLLY_HAVE_MEMRCHR=1 \
-  -DFOLLY_USE_LIBCPP=1
+#  -DFOLLY_USE_LIBCPP=1
 
 # If APP_PLATFORM in Application.mk targets android-23 above, please comment this line.
 # NDK uses GNU style stderror_r() after API 23.
@@ -94,4 +94,4 @@
 
 $(call import-module,glog)
 $(call import-module,double-conversion)
-$(call import-module,boost)
+$(call import-module,boost)
\ No newline at end of file
