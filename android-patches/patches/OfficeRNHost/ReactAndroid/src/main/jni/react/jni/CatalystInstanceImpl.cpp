--- ./ReactAndroid/src/main/jni/react/jni/CatalystInstanceImpl.cpp	2022-01-11 17:41:29.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/OfficeRNHost/ReactAndroid/src/main/jni/react/jni/CatalystInstanceImpl.cpp	2022-01-12 16:43:26.000000000 -0800
@@ -103,6 +103,7 @@
 void CatalystInstanceImpl::registerNatives() {
   registerHybrid({
       makeNativeMethod("initHybrid", CatalystInstanceImpl::initHybrid),
+      makeNativeMethod("createModuleRegistry", CatalystInstanceImpl::createModuleRegistry),
       makeNativeMethod(
           "initializeBridge", CatalystInstanceImpl::initializeBridge),
       makeNativeMethod(
@@ -135,6 +136,7 @@
           CatalystInstanceImpl::handleMemoryPressure),
       makeNativeMethod(
           "getRuntimeExecutor", CatalystInstanceImpl::getRuntimeExecutor),
+      makeNativeMethod("getPointerOfInstancePointer", CatalystInstanceImpl::getPointerOfInstancePointer),
       makeNativeMethod(
           "warnOnLegacyNativeModuleSystemUse",
           CatalystInstanceImpl::warnOnLegacyNativeModuleSystemUse),
@@ -143,6 +145,23 @@
   JNativeRunnable::registerNatives();
 }
 
+void CatalystInstanceImpl::createModuleRegistry(
+   jni::alias_ref<JavaMessageQueueThread::javaobject> nativeModulesQueue,
+   jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
+   jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject> cxxModules) {
+  moduleMessageQueue_ = std::make_shared<JMessageQueueThread>(nativeModulesQueue);
+
+  moduleRegistry_ = std::make_shared<ModuleRegistry>(
+    buildNativeModuleList(
+       std::weak_ptr<Instance>(instance_),
+       javaModules,
+       cxxModules,
+       moduleMessageQueue_
+       ));
+
+  instance_->setModuleRegistry(moduleRegistry_);
+}
+
 void log(ReactNativeLogLevel level, const char *message) {
   switch (level) {
     case ReactNativeLogLevelInfo:
@@ -166,19 +185,14 @@
     jni::alias_ref<ReactCallback::javaobject> callback,
     // This executor is actually a factory holder.
     JavaScriptExecutorHolder *jseh,
-    jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue,
-    jni::alias_ref<JavaMessageQueueThread::javaobject> nativeModulesQueue,
-    jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject>
-        javaModules,
-    jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject>
-        cxxModules) {
+    jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue) {
   set_react_native_logfunc(&log);
 
   // TODO mhorowitz: how to assert here?
   // Assertions.assertCondition(mBridge == null, "initializeBridge should be
   // called once");
-  moduleMessageQueue_ =
-      std::make_shared<JMessageQueueThread>(nativeModulesQueue);
+  // moduleMessageQueue_ =
+  //     std::make_shared<JMessageQueueThread>(nativeModulesQueue);
 
   // This used to be:
   //
@@ -197,12 +211,13 @@
   // don't need jsModuleDescriptions any more, all the way up and down the
   // stack.
 
-  moduleRegistry_ = std::make_shared<ModuleRegistry>(buildNativeModuleList(
-      std::weak_ptr<Instance>(instance_),
-      javaModules,
-      cxxModules,
-      moduleMessageQueue_));
+  // moduleRegistry_ = std::make_shared<ModuleRegistry>(buildNativeModuleList(
+  //     std::weak_ptr<Instance>(instance_),
+  //     javaModules,
+  //     cxxModules,
+  //     moduleMessageQueue_));
 
+  // TODO:: Office - Assert that moduleRegistry_ is created .. i.e. not null
   instance_->initializeBridge(
       std::make_unique<JInstanceCallback>(callback, moduleMessageQueue_),
       jseh->getExecutorFactory(),
@@ -335,6 +350,10 @@
   instance_->handleMemoryPressure(pressureLevel);
 }
 
+jlong CatalystInstanceImpl::getPointerOfInstancePointer() {
+  return (jlong) (intptr_t) (&instance_);
+}
+
 jni::alias_ref<CallInvokerHolder::javaobject>
 CatalystInstanceImpl::getJSCallInvokerHolder() {
   if (!jsCallInvokerHolder_) {
