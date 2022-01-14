--- /dev/null	2022-01-12 17:14:59.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/V8/ReactAndroid/src/main/java/com/facebook/react/v8executor/V8ExecutorFactory.java	2022-01-12 15:04:31.000000000 -0800
@@ -0,0 +1,93 @@
+/*
+ * Copyright (c) 2015-present, Facebook, Inc.
+ *
+ * This source code is licensed under the MIT license found in the
+ * LICENSE file in the root directory of this source tree.
+ */
+
+package com.facebook.react.v8executor;
+
+import com.facebook.react.bridge.JavaScriptExecutor;
+import com.facebook.react.bridge.JavaScriptExecutorFactory;
+import com.facebook.react.bridge.WritableNativeMap;
+
+public class V8ExecutorFactory implements JavaScriptExecutorFactory {
+  public static class V8ConfigParams {
+    public enum CacheType {
+      NoCache,
+      CodeCache,
+      FullCodeCache
+    }
+
+    private String mCacheDirectory;
+    private CacheType mCacheType;
+    private boolean mUseLazyScriptCompilation;
+
+    public String getCacheDirectory() {
+      return mCacheDirectory;
+    }
+
+    public V8ConfigParams.CacheType getCacheType() {
+      return mCacheType;
+    }
+
+    public boolean useLazyScriptCompilation() {
+      return mUseLazyScriptCompilation;
+    }
+
+    public V8ConfigParams() {
+      mCacheType = CacheType.NoCache;
+      mCacheDirectory = "";
+    }
+
+    public V8ConfigParams(String cacheDirectory, CacheType cacheType, boolean useLazyScriptCompilation) {
+      mCacheDirectory = cacheDirectory;
+      mCacheType = cacheType;
+      mUseLazyScriptCompilation = useLazyScriptCompilation;
+    }
+  }
+
+  private final String mAppName;
+  private final String mDeviceName;
+  private V8ConfigParams mV8ConfigParams;
+
+  public V8ExecutorFactory(String appName, String deviceName) {
+    this.mAppName = appName;
+    this.mDeviceName = deviceName;
+    this.mV8ConfigParams = new V8ConfigParams();
+  }
+
+  public V8ExecutorFactory(String appName, String deviceName, V8ConfigParams v8ConfigParams) {
+    this.mAppName = appName;
+    this.mDeviceName = deviceName;
+    this.mV8ConfigParams = v8ConfigParams;
+  }
+
+  @Override
+  public JavaScriptExecutor create() throws Exception {
+    WritableNativeMap v8Config = new WritableNativeMap();
+    v8Config.putString("OwnerIdentity", "ReactNative");
+    v8Config.putString("AppIdentity", mAppName);
+    v8Config.putString("DeviceIdentity", mDeviceName);
+    v8Config.putString("CacheDirectory", mV8ConfigParams.getCacheDirectory());
+    v8Config.putBoolean("UseLazyScriptCompilation", mV8ConfigParams.useLazyScriptCompilation());
+    v8Config.putInt("CacheType", mV8ConfigParams.getCacheType().ordinal());
+
+    return new V8Executor(v8Config);
+  }
+
+  @Override
+  public void startSamplingProfiler() {
+    // Nope
+  }
+
+  @Override
+  public void stopSamplingProfiler(String filename) {
+    // Nope
+  }
+
+  @Override
+  public String toString() {
+    return "JSIExecutor+V8Runtime";
+  }
+}
