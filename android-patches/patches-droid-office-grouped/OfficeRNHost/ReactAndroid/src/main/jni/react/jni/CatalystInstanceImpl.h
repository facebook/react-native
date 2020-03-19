--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.h"	2020-01-30 13:55:48.476581100 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.h"	2020-02-20 11:21:17.375511700 -0800
@@ -46,14 +46,16 @@
 
   CatalystInstanceImpl();
 
+  void createModuleRegistry(
+     jni::alias_ref<JavaMessageQueueThread::javaobject> nativeModulesQueue,
+     jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
+     jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject> cxxModules);
+
   void initializeBridge(
       jni::alias_ref<ReactCallback::javaobject> callback,
       // This executor is actually a factory holder.
       JavaScriptExecutorHolder* jseh,
-      jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue,
-      jni::alias_ref<JavaMessageQueueThread::javaobject> moduleQueue,
-      jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
-      jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject> cxxModules);
+      jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue);
 
   void extendNativeModules(
     jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
@@ -80,6 +82,7 @@
                          std::string&& jsonValue);
   jlong getJavaScriptContext();
   void handleMemoryPressure(int pressureLevel);
+  jlong getPointerOfInstancePointer();
 
   // This should be the only long-lived strong reference, but every C++ class
   // will have a weak reference.
