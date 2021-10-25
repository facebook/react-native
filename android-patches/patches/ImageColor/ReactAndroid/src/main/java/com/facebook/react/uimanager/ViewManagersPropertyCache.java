diff --git a/ReactAndroid/src/main/java/com/facebook/react/uimanager/ViewManagersPropertyCache.java b/ReactAndroid/src/main/java/com/facebook/react/uimanager/ViewManagersPropertyCache.java
index 6e2a1691fd..f856e85d53 100644
--- a/ReactAndroid/src/main/java/com/facebook/react/uimanager/ViewManagersPropertyCache.java
+++ b/ReactAndroid/src/main/java/com/facebook/react/uimanager/ViewManagersPropertyCache.java
@@ -325,6 +325,21 @@ import java.util.Map;
     }
   }
 
+  private static class BoxedColorPropSetter extends PropSetter {
+
+    public BoxedColorPropSetter(ReactProp prop, Method setter) {
+      super(prop, "mixed", setter);
+    }
+
+    @Override
+    protected @Nullable Object getValueOrDefault(Object value, Context context) {
+      if (value != null) {
+        return ColorPropConverter.getColor(value, context);
+      }
+      return null;
+    }
+  }
+
   /*package*/ static Map<String, String> getNativePropsForView(
       Class<? extends ViewManager> viewManagerTopClass,
       Class<? extends ReactShadowNode> shadowNodeTopClass) {
@@ -418,7 +433,7 @@ import java.util.Map;
       return new BoxedBooleanPropSetter(annotation, method);
     } else if (propTypeClass == Integer.class) {
       if ("Color".equals(annotation.customType())) {
-        return new ColorPropSetter(annotation, method);
+        return new BoxedColorPropSetter(annotation, method);
       }
       return new BoxedIntPropSetter(annotation, method);
     } else if (propTypeClass == ReadableArray.class) {
