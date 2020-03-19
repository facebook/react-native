--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\view\\ReactViewManager.java"	2020-01-30 13:55:48.443613200 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\view\\ReactViewManager.java"	2020-01-29 14:10:09.644920800 -0800
@@ -10,7 +10,9 @@
 import android.annotation.TargetApi;
 import android.graphics.Rect;
 import android.os.Build;
+import android.view.FocusFinder;
 import android.view.View;
+import android.view.ViewGroup;
 import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
 import com.facebook.react.bridge.ReactContext;
 import com.facebook.react.bridge.ReadableArray;
@@ -32,6 +34,7 @@
 import java.util.Locale;
 import java.util.Map;
 import javax.annotation.Nullable;
+import javax.annotation.Nonnull;
 
 /**
  * View manager for AndroidViews (plain React Views).
@@ -51,13 +54,14 @@
     Spacing.START,
     Spacing.END,
   };
-  private static final int CMD_HOTSPOT_UPDATE = 1;
-  private static final int CMD_SET_PRESSED = 2;
 
-  @ReactProp(name = "accessible")
-  public void setAccessible(ReactViewGroup view, boolean accessible) {
-    view.setFocusable(accessible);
-  }
+  // Focus or blur call on native components (through NativeMethodsMixin) redirects to TextInputState.js
+  // which dispatches focusTextInput or blurTextInput commands. These commands are mapped to FOCUS_TEXT_INPUT=1
+  // and BLUR_TEXT_INPUT=2 in ReactTextInputManager, hence these constants value should be in sync with ReactTextInputManager.
+  private static final int FOCUS_TEXT_INPUT = 1;
+  private static final int BLUR_TEXT_INPUT = 2;
+  private static final int CMD_HOTSPOT_UPDATE = 3;
+  private static final int CMD_SET_PRESSED = 4;
 
   @ReactProp(name = "hasTVPreferredFocus")
   public void setTVPreferredFocus(ReactViewGroup view, boolean hasTVPreferredFocus) {
@@ -122,6 +126,35 @@
     }
   }
 
+  @Nullable
+  @Override
+  public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
+    return MapBuilder.<String, Object>builder()
+      .put(
+        "topOnFocusChange",
+        MapBuilder.of(
+          "phasedRegistrationNames",
+          MapBuilder.of("bubbled", "onFocusChange")))
+      .build();
+  }
+
+  @Override
+  protected void addEventEmitters(
+    final ThemedReactContext reactContext,
+    final ReactViewGroup reactViewGroup) {
+    reactViewGroup.setOnFocusChangeListener(
+      new View.OnFocusChangeListener() {
+        @Override
+        public void onFocusChange(View v, boolean hasFocus) {
+          EventDispatcher eventDispatcher =
+            reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
+            eventDispatcher.dispatchEvent(
+              new ReactViewFocusEvent(reactViewGroup.getId(), hasFocus));
+        }
+      }
+    );
+  }
+
   @ReactProp(name = "borderStyle")
   public void setBorderStyle(ReactViewGroup view, @Nullable String borderStyle) {
     view.setBorderStyle(borderStyle);
@@ -281,7 +314,7 @@
 
   @Override
   public Map<String, Integer> getCommandsMap() {
-    return MapBuilder.of("hotspotUpdate", CMD_HOTSPOT_UPDATE, "setPressed", CMD_SET_PRESSED);
+    return MapBuilder.of("focusTextInput", FOCUS_TEXT_INPUT, "blurTextInput", BLUR_TEXT_INPUT, "hotspotUpdate", CMD_HOTSPOT_UPDATE, "setPressed", CMD_SET_PRESSED);
   }
 
   @Override
@@ -307,6 +340,14 @@
         root.setPressed(args.getBoolean(0));
         break;
       }
+      case FOCUS_TEXT_INPUT: {
+        root.requestFocus();
+        break;
+      }
+      case BLUR_TEXT_INPUT: {
+        root.clearFocus();
+        break;
+      }
     }
   }
 
@@ -350,10 +391,44 @@
       }
       parent.removeViewWithSubviewClippingEnabled(child);
     } else {
+      // Prevent focus leaks due to removal of a focused View
+      if (parent.getChildAt(index).hasFocus()) {
+        giveFocusToAppropriateView(parent, parent.getChildAt(index));
+      }
       parent.removeViewAt(index);
     }
   }
 
+  private void giveFocusToAppropriateView(@Nonnull ViewGroup parent, @Nonnull View focusedView) {
+    // Search for appropriate sibling
+    View viewToTakeFocus = null;
+    while (parent != null) {
+      // Search DOWN
+      viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_DOWN);
+      if (viewToTakeFocus == null) {
+        // Search RIGHT
+        viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_RIGHT);
+        if (viewToTakeFocus == null) {
+          // Search UP
+          viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_UP);
+          if (viewToTakeFocus == null) {
+            // Search LEFT
+            viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_LEFT);
+          }
+        }
+      }
+      if (viewToTakeFocus != null || !(parent.getParent() instanceof ViewGroup)) {
+        break;
+      }
+      parent = (ViewGroup) parent.getParent();
+    }
+
+    // Give focus to View
+    if (viewToTakeFocus != null) {
+      viewToTakeFocus.requestFocus();
+    }
+  }
+
   @Override
   public void removeAllViews(ReactViewGroup parent) {
     boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
