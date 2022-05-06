--- ./ReactAndroid/src/main/jni/react/jni/CatalystInstanceImpl.h	2022-01-11 17:41:29.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/OfficeRNHost/ReactAndroid/src/main/jni/react/jni/CatalystInstanceImpl.h	2022-01-12 15:04:31.000000000 -0800
@@ -55,17 +55,16 @@
       bool enableRuntimeScheduler,
       bool enableRuntimeSchedulerInTurboModule);
 
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
 
   // When called from CatalystInstanceImpl.java, warnings will be logged when
   // CxxNativeModules are used. Java NativeModule usages log error in Java.
@@ -108,6 +107,7 @@
   void setGlobalVariable(std::string propName, std::string &&jsonValue);
   jlong getJavaScriptContext();
   void handleMemoryPressure(int pressureLevel);
+  jlong getPointerOfInstancePointer();
 
   void createAndInstallRuntimeSchedulerIfNecessary();
 
