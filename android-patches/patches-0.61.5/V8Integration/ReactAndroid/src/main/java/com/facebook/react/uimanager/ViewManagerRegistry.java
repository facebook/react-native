--- "D:\\code\\work\\react-native-fb61merge-dirty-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\ViewManagerRegistry.java"	2020-04-27 19:38:02.087006500 -0700
+++ "D:\\code\\work\\react-native-fb61merge-dirty\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\ViewManagerRegistry.java"	2020-04-27 23:40:46.828411100 -0700
@@ -8,8 +8,11 @@
 
 import androidx.annotation.Nullable;
 import com.facebook.react.common.MapBuilder;
+import com.facebook.react.common.ReactConstants;
+import java.util.HashMap;
 import java.util.List;
 import java.util.Map;
+import android.util.Log;
 
 /**
  * Class that stores the mapping between native view name used in JS and the corresponding instance
@@ -19,6 +22,18 @@
 
   private final Map<String, ViewManager> mViewManagers;
   private final @Nullable UIManagerModule.ViewManagerResolver mViewManagerResolver;
+  private static Map<String, String> sComponentNames = new HashMap<>();
+
+    static {
+        sComponentNames.put("Image", "RCTImageView");
+        sComponentNames.put("ForwardRef(Image)", "RCTImageView");
+        sComponentNames.put("Text", "RCTText");
+        sComponentNames.put("TextInput", "AndroidTextInput");
+        sComponentNames.put("TouchableHighlight", "RCTView");
+        sComponentNames.put("WebView", "RCTWebView");
+      }
+
+
 
   public ViewManagerRegistry(UIManagerModule.ViewManagerResolver viewManagerResolver) {
     mViewManagers = MapBuilder.newHashMap();
@@ -42,17 +57,25 @@
   }
 
   public ViewManager get(String className) {
-    ViewManager viewManager = mViewManagers.get(className);
+    String newClassName;
+    if (sComponentNames.containsKey(className)) {
+      newClassName = sComponentNames.get(className);
+    } else {
+      newClassName = className;
+    }
+
+    ViewManager viewManager = mViewManagers.get(newClassName);
     if (viewManager != null) {
       return viewManager;
     }
     if (mViewManagerResolver != null) {
-      viewManager = mViewManagerResolver.getViewManager(className);
+      viewManager = mViewManagerResolver.getViewManager(newClassName);
       if (viewManager != null) {
-        mViewManagers.put(className, viewManager);
+        mViewManagers.put(newClassName, viewManager);
         return viewManager;
       }
     }
-    throw new IllegalViewOperationException("No ViewManager defined for class " + className);
+    Log.w(ReactConstants.TAG, "No ViewManager defined for class: " + newClassName);
+    throw new IllegalViewOperationException("No ViewManager defined for class " + newClassName);
   }
 }
