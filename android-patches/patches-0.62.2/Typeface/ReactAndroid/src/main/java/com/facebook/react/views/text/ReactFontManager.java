--- "d:\\code\\work\\rn-62-db\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\text\\ReactFontManager.java"	2020-05-02 18:36:31.994612900 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\text\\ReactFontManager.java"	2020-05-02 19:52:26.730230700 -0700
@@ -11,6 +11,7 @@
 import android.content.res.AssetManager;
 import android.graphics.Typeface;
 import android.os.Build;
+import android.util.Pair;
 import android.util.SparseArray;
 import androidx.annotation.NonNull;
 import androidx.annotation.Nullable;
@@ -35,7 +36,7 @@
   private static ReactFontManager sReactFontManagerInstance;
 
   private final Map<String, FontFamily> mFontCache;
-  private final Map<String, Typeface> mCustomTypefaceCache;
+  final private Map<Pair<String, Integer>, Typeface> mCustomTypefaceCache;
 
   private ReactFontManager() {
     mFontCache = new HashMap<>();
@@ -56,12 +57,18 @@
 
   public @Nullable Typeface getTypeface(
       String fontFamilyName, int style, int weight, AssetManager assetManager) {
-    if (mCustomTypefaceCache.containsKey(fontFamilyName)) {
-      Typeface typeface = mCustomTypefaceCache.get(fontFamilyName);
-      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && weight >= 100 && weight <= 1000) {
-        return Typeface.create(typeface, weight, (style & Typeface.ITALIC) != 0);
-      }
-      return Typeface.create(typeface, style);
+    Pair key = Pair.create(fontFamilyName, weight);
+    if (mCustomTypefaceCache.containsKey(key)) {
+      return Typeface.create(mCustomTypefaceCache.get(key), style);
+    } else {
+      key = Pair.create(fontFamilyName, null);
+      if(mCustomTypefaceCache.containsKey(key)) {
+        Typeface typeface = mCustomTypefaceCache.get(fontFamilyName);
+        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && weight >= 100 && weight <= 1000) {
+          return Typeface.create(typeface, weight, (style & Typeface.ITALIC) != 0);
+        }
+        return Typeface.create(typeface, style);
+     }
     }
 
     FontFamily fontFamily = mFontCache.get(fontFamilyName);
@@ -91,8 +98,32 @@
   public void addCustomFont(@NonNull Context context, @NonNull String fontFamily, int fontId) {
     Typeface font = ResourcesCompat.getFont(context, fontId);
     if (font != null) {
-      mCustomTypefaceCache.put(fontFamily, font);
+      addCustomFont(fontFamily, font);
+    }
+  }
+
+  /*
+   * This method allows you to load custom fonts from a custom Typeface object and register it as a specific 
+   * fontFamily and weight.  This can be used when fonts are delivered during runtime and cannot be included in
+   * the standard app resources.  Typeface's registered using a specific weight will take priority over ones
+   * registered without a specific weight.
+   *
+   * ReactFontManager.getInstance().addCustomFont("Srisakdi", 600, typeface);
+   */
+  public void addCustomFont(@NonNull String fontFamily, int weight, @NonNull Typeface typeface) {
+      mCustomTypefaceCache.put(Pair.create(fontFamily, weight), typeface);
     }
+  
+  /*
+   * This method allows you to load custom fonts from a custom Typeface object and register it as a specific 
+   * fontFamily.  This can be used when fonts are delivered during runtime and cannot be included in
+   * the standard app resources. Typeface's registered using a specific weight will take priority over ones
+   * registered without a specific weight.
+   *
+   * ReactFontManager.getInstance().addCustomFont("Srisakdi", typeface);
+   */
+  public void addCustomFont(@NonNull String fontFamily, @NonNull Typeface typeface) {
+    mCustomTypefaceCache.put(Pair.create(fontFamily, null), typeface);
   }
 
   /**
