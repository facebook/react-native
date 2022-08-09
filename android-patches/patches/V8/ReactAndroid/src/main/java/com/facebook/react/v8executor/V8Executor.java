diff --git a/ReactAndroid/src/main/java/com/facebook/react/v8executor/V8Executor.java b/ReactAndroid/src/main/java/com/facebook/react/v8executor/V8Executor.java
new file mode 100644
index 0000000000..c28186d613
--- /dev/null
+++ b/ReactAndroid/src/main/java/com/facebook/react/v8executor/V8Executor.java
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
