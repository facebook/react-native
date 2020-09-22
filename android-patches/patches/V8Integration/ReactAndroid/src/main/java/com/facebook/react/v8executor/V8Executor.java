--- /home/mganandraj/code/react-native-0.62.2/ReactAndroid/src/main/java/com/facebook/react/v8executor/V8Executor.java	1969-12-31 16:00:00.000000000 -0800
+++ /home/mganandraj/code/react-native-macos/ReactAndroid/src/main/java/com/facebook/react/v8executor/V8Executor.java	2020-06-09 12:46:01.319769902 -0700
@@ -0,0 +1,32 @@
+/**
+ * Copyright (c) 2015-present, Facebook, Inc.
+ *
+ * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
+ * directory of this source tree.
+ */
+
+package com.facebook.react.v8executor;
+
+import com.facebook.jni.HybridData;
+import com.facebook.proguard.annotations.DoNotStrip;
+import com.facebook.react.bridge.JavaScriptExecutor;
+import com.facebook.react.bridge.ReadableNativeMap;
+import com.facebook.soloader.SoLoader;
+
+@DoNotStrip
+/* package */ class V8Executor extends JavaScriptExecutor {
+  static {
+    SoLoader.loadLibrary("v8executor");
+  }
+
+  /* package */ V8Executor(ReadableNativeMap v8Config) {
+    super(initHybrid(v8Config));
+  }
+
+  @Override
+  public String getName() {
+    return "V8Executor";
+  }
+
+  private static native HybridData initHybrid(ReadableNativeMap v8Config);
+}
