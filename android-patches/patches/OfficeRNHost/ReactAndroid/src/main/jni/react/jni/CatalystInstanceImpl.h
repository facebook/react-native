--- "E:\\github\\rnm-63-fresh\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.h"	2020-10-27 20:26:17.024172000 -0700
+++ "E:\\github\\rnm-63\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.h"	2020-10-13 21:51:15.981376100 -0700
@@ -49,17 +49,16 @@
 
   CatalystInstanceImpl();
 
+  void createModuleRegistry(
+    jni::alias_ref<JavaMessageQueueThread::javaobject> nativeModulesQueue,
+    jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
+    jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject> cxxModules);
+
   void initializeBridge(
       jni::alias_ref<ReactCallback::javaobject> callback,
       // This executor is actually a factory holder.
       JavaScriptExecutorHolder *jseh,
-      jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue,
-      jni::alias_ref<JavaMessageQueueThread::javaobject> moduleQueue,
-      jni::alias_ref<
-          jni::JCollection<JavaModuleWrapper::javaobject>::javaobject>
-          javaModules,
-      jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject>
-          cxxModules);
+      jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue);
 
   void extendNativeModules(
       jni::alias_ref<jni::JCollection<
@@ -97,6 +96,7 @@
   void setGlobalVariable(std::string propName, std::string &&jsonValue);
   jlong getJavaScriptContext();
   void handleMemoryPressure(int pressureLevel);
+  jlong getPointerOfInstancePointer();
 
   // This should be the only long-lived strong reference, but every C++ class
   // will have a weak reference.
