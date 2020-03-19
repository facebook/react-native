--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\JavaModuleWrapper.java"	2020-01-30 13:55:48.265579000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\JavaModuleWrapper.java"	2020-01-29 14:10:09.356910500 -0800
@@ -36,7 +36,7 @@
 @DoNotStrip
 public class JavaModuleWrapper {
   @DoNotStrip
-  public class MethodDescriptor {
+  public static class MethodDescriptor {
     @DoNotStrip
     Method method;
     @DoNotStrip
@@ -46,8 +46,8 @@
     @DoNotStrip
     String type;
   }
-
-  private final JSInstance mJSInstance;
+  
+  protected final JSInstance mJSInstance;
   private final ModuleHolder mModuleHolder;
   private final ArrayList<NativeModule.NativeMethod> mMethods;
   private final ArrayList<MethodDescriptor> mDescs;
