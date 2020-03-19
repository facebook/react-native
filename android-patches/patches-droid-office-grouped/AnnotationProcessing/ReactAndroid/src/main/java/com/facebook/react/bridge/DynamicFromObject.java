--- "E:\\github\\fb-rn-p\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\DynamicFromObject.java"	2020-02-17 14:22:31.157023700 -0800
+++ "E:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\DynamicFromObject.java"	2020-02-27 13:58:33.821614900 -0800
@@ -7,7 +7,8 @@
 
 package com.facebook.react.bridge;
 
-import com.facebook.common.logging.FLog;
+// Using Flog causes issue with Processor hence commenting its usage.
+// import com.facebook.common.logging.FLog;
 import com.facebook.react.common.ReactConstants;
 import javax.annotation.Nullable;
 
@@ -82,7 +83,7 @@
     if (mObject instanceof ReadableArray) {
       return ReadableType.Array;
     }
-    FLog.e(ReactConstants.TAG, "Unmapped object type " + mObject.getClass().getName());
+    // FLog.e(ReactConstants.TAG, "Unmapped object type " + mObject.getClass().getName());
     return ReadableType.Null;
   }
 }
