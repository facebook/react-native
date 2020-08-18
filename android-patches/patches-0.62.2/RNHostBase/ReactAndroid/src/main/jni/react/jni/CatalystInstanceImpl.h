--- "D:\\code\\work\\rn-62-db\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.h"	2020-04-30 21:53:47.018754100 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.h"	2020-04-30 22:43:14.541110000 -0700
@@ -49,17 +49,16 @@
 
   CatalystInstanceImpl();
 
+  void createModuleRegistry(
+     jni::alias_ref<JavaMessageQueueThread::javaobject> nativeModulesQueue,
+     jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
+     jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject> cxxModules);
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
@@ -96,6 +95,7 @@
   void setGlobalVariable(std::string propName, std::string &&jsonValue);
   jlong getJavaScriptContext();
   void handleMemoryPressure(int pressureLevel);
+  jlong getPointerOfInstancePointer();
 
   // This should be the only long-lived strong reference, but every C++ class
   // will have a weak reference.
