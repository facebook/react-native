diff --git a/packages/rn-tester/android/app/src/main/java/com/facebook/react/uiapp/RNTesterApplication.java b/packages/rn-tester/android/app/src/main/java/com/facebook/react/uiapp/RNTesterApplication.java
index 1a393ce051d..129a4a8dea2 100644
--- a/packages/rn-tester/android/app/src/main/java/com/facebook/react/uiapp/RNTesterApplication.java
+++ b/packages/rn-tester/android/app/src/main/java/com/facebook/react/uiapp/RNTesterApplication.java
@@ -7,11 +7,15 @@
 
 package com.facebook.react.uiapp;
 
+import static com.facebook.react.modules.systeminfo.AndroidInfoHelpers.getFriendlyDeviceName;
+
 import android.app.Application;
 import android.content.Context;
 import androidx.annotation.NonNull;
 import androidx.annotation.Nullable;
 import com.facebook.fbreact.specs.SampleTurboModule;
+import com.facebook.hermes.reactexecutor.HermesExecutorFactory;
+import com.facebook.react.jscexecutor.JSCExecutorFactory;
 import com.facebook.react.ReactApplication;
 import com.facebook.react.ReactInstanceManager;
 import com.facebook.react.ReactNativeHost;
@@ -23,6 +27,7 @@ import com.facebook.react.bridge.JSIModuleProvider;
 import com.facebook.react.bridge.JSIModuleSpec;
 import com.facebook.react.bridge.JSIModuleType;
 import com.facebook.react.bridge.JavaScriptContextHolder;
+import com.facebook.react.bridge.JavaScriptExecutorFactory;
 import com.facebook.react.bridge.NativeModule;
 import com.facebook.react.bridge.ReactApplicationContext;
 import com.facebook.react.bridge.UIManager;
@@ -38,6 +43,7 @@ import com.facebook.react.uiapp.component.MyNativeViewManager;
 import com.facebook.react.uimanager.ViewManager;
 import com.facebook.react.uimanager.ViewManagerRegistry;
 import com.facebook.react.views.text.ReactFontManager;
+import com.facebook.react.v8executor.V8ExecutorFactory;
 import com.facebook.soloader.SoLoader;
 import java.lang.reflect.InvocationTargetException;
 import java.util.ArrayList;
@@ -51,6 +57,20 @@ public class RNTesterApplication extends Application implements ReactApplication
 
   private final ReactNativeHost mReactNativeHost =
       new ReactNativeHost(this) {
+        @Override
+        public JavaScriptExecutorFactory getJavaScriptExecutorFactory() {
+          if (BuildConfig.FLAVOR.equals("hermes")) {
+            return new HermesExecutorFactory();
+          } else if (BuildConfig.FLAVOR.equals("v8")) {
+            return new V8ExecutorFactory(getApplication().getPackageName(), getFriendlyDeviceName());
+          } else if (BuildConfig.FLAVOR.equals("jsc")) {
+            SoLoader.loadLibrary("jscexecutor");
+            return new JSCExecutorFactory(getApplication().getPackageName(), getFriendlyDeviceName());
+          } else {
+            throw new IllegalArgumentException("Missing handler in getJavaScriptExecutorFactory for build flavor: " + BuildConfig.FLAVOR);
+          }
+        }
+
         @Override
         public String getJSMainModuleName() {
           return "packages/rn-tester/js/RNTesterApp.android";
