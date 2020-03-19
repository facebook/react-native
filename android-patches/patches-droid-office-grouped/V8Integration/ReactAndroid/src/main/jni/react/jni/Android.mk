--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\react\\jni\\Android.mk"	2020-01-30 13:55:48.475581100 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\react\\jni\\Android.mk"	2020-01-29 14:10:09.676889700 -0800
@@ -53,7 +53,6 @@
 #   to the specification inside <dir>/<module-dir>/Android.mk.
 $(call import-module,folly)
 $(call import-module,fb)
-$(call import-module,jsc)
 $(call import-module,fbgloginit)
 $(call import-module,yogajni)
 $(call import-module,cxxreact)
@@ -66,5 +65,4 @@
 # TODO(ramanpreet):
 #   Why doesn't this import-module call generate a jscexecutor.so file?
 # $(call import-module,jscexecutor)
-
-include $(REACT_SRC_DIR)/jscexecutor/Android.mk
+include $(REACT_SRC_DIR)/v8executor/Android.mk
\ No newline at end of file
