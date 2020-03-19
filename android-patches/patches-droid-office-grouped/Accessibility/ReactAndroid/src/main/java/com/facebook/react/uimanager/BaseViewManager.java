--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\BaseViewManager.java"	2020-01-30 13:55:48.359581100 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\BaseViewManager.java"	2020-01-29 14:10:09.444887800 -0800
@@ -6,22 +6,25 @@
 package com.facebook.react.uimanager;
 
 import android.graphics.Color;
+import android.view.accessibility.AccessibilityNodeInfo;
 import android.view.View;
 import android.view.ViewParent;
 import androidx.core.view.ViewCompat;
 
-import java.util.HashMap;
-
 import com.facebook.react.R;
 import com.facebook.react.bridge.ReadableArray;
+import com.facebook.react.bridge.ReadableMap;
+import com.facebook.react.bridge.ReadableType;
 import com.facebook.react.common.MapBuilder;
 import com.facebook.react.uimanager.ReactAccessibilityDelegate;
 import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole;
 import com.facebook.react.uimanager.annotations.ReactProp;
 import com.facebook.react.uimanager.util.ReactFindViewUtil;
 
-import javax.annotation.Nonnull;
 import java.util.Map;
+import java.util.HashMap;
+
+import javax.annotation.Nonnull;
 import javax.annotation.Nullable;
 
 /**
@@ -31,11 +34,13 @@
 public abstract class BaseViewManager<T extends View, C extends LayoutShadowNode>
     extends ViewManager<T, C> {
 
+  private static final String CLICKABLE = "clickable";
   private static final String PROP_BACKGROUND_COLOR = ViewProps.BACKGROUND_COLOR;
   private static final String PROP_TRANSFORM = "transform";
   private static final String PROP_ELEVATION = "elevation";
   private static final String PROP_Z_INDEX = "zIndex";
   private static final String PROP_RENDER_TO_HARDWARE_TEXTURE = "renderToHardwareTextureAndroid";
+  private static final String PROP_ACCESSIBLE = "accessible";
   private static final String PROP_ACCESSIBILITY_LABEL = "accessibilityLabel";
   private static final String PROP_ACCESSIBILITY_HINT = "accessibilityHint";
   private static final String PROP_ACCESSIBILITY_LIVE_REGION = "accessibilityLiveRegion";
@@ -43,6 +48,7 @@
   private static final String PROP_ACCESSIBILITY_STATES = "accessibilityStates";
   private static final String PROP_ACCESSIBILITY_ACTIONS = "accessibilityActions";
   private static final String PROP_IMPORTANT_FOR_ACCESSIBILITY = "importantForAccessibility";
+  private static final String PROP_ACCESSIBILITY_NODE_INFO = "accessibilityNodeInfo";
 
   // DEPRECATED
   private static final String PROP_ROTATION = "rotation";
@@ -124,6 +130,11 @@
     ReactFindViewUtil.notifyViewRendered(view);
   }
 
+  @ReactProp(name = PROP_ACCESSIBLE)
+  public void setAccessible(T view, boolean accessible) {
+    view.setImportantForAccessibility(accessible ? View.IMPORTANT_FOR_ACCESSIBILITY_YES : View.IMPORTANT_FOR_ACCESSIBILITY_NO);
+  }
+
   @ReactProp(name = PROP_ACCESSIBILITY_LABEL)
   public void setAccessibilityLabel(@Nonnull T view, String accessibilityLabel) {
     view.setTag(R.id.accessibility_label, accessibilityLabel);
@@ -215,6 +226,24 @@
     }
   }
 
+  @ReactProp(name = PROP_ACCESSIBILITY_NODE_INFO)
+  public void setAccessibilityNodeInfo(T view, @Nullable ReadableMap map) {
+    if(map == null) {
+      return ;
+    }
+    view.setAccessibilityDelegate(new View.AccessibilityDelegate() {
+      @Override
+      public void onInitializeAccessibilityNodeInfo(View host, AccessibilityNodeInfo info) {
+        super.onInitializeAccessibilityNodeInfo(host, info);
+        if(map.hasKey(CLICKABLE))
+        {
+          if(map.getType(CLICKABLE) == ReadableType.Boolean)
+          info.setClickable(map.getBoolean(CLICKABLE));
+        }
+      }
+    });
+  }
+ 
   @Deprecated
   @ReactProp(name = PROP_ROTATION)
   public void setRotation(@Nonnull T view, float rotation) {
