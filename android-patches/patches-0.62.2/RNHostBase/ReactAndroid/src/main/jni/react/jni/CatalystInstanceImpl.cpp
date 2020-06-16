--- "D:\\code\\work\\rn-62-db\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.cpp"	2020-04-30 21:53:47.017751900 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.cpp"	2020-04-30 23:12:59.608149700 -0700
@@ -102,6 +102,7 @@
 void CatalystInstanceImpl::registerNatives() {
   registerHybrid({
       makeNativeMethod("initHybrid", CatalystInstanceImpl::initHybrid),
+      makeNativeMethod("createModuleRegistry", CatalystInstanceImpl::createModuleRegistry),
       makeNativeMethod(
           "initializeBridge", CatalystInstanceImpl::initializeBridge),
       makeNativeMethod(
@@ -132,26 +133,39 @@
       makeNativeMethod(
           "jniHandleMemoryPressure",
           CatalystInstanceImpl::handleMemoryPressure),
+      makeNativeMethod("getPointerOfInstancePointer", CatalystInstanceImpl::getPointerOfInstancePointer)
   });
 
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
 void CatalystInstanceImpl::initializeBridge(
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
   // TODO mhorowitz: how to assert here?
   // Assertions.assertCondition(mBridge == null, "initializeBridge should be
   // called once");
-  moduleMessageQueue_ =
-      std::make_shared<JMessageQueueThread>(nativeModulesQueue);
+  // moduleMessageQueue_ =
+  //     std::make_shared<JMessageQueueThread>(nativeModulesQueue);
 
   // This used to be:
   //
@@ -170,11 +184,7 @@
   // don't need jsModuleDescriptions any more, all the way up and down the
   // stack.
 
-  moduleRegistry_ = std::make_shared<ModuleRegistry>(buildNativeModuleList(
-      std::weak_ptr<Instance>(instance_),
-      javaModules,
-      cxxModules,
-      moduleMessageQueue_));
+  // TODO:: Office - Assert that moduleRegistry_ is created .. i.e. not null
 
   instance_->initializeBridge(
       std::make_unique<JInstanceCallback>(callback, moduleMessageQueue_),
@@ -285,6 +295,10 @@
   instance_->handleMemoryPressure(pressureLevel);
 }
 
+jlong CatalystInstanceImpl::getPointerOfInstancePointer() {
+  return (jlong) (intptr_t) (&instance_);
+}
+
 jni::alias_ref<CallInvokerHolder::javaobject>
 CatalystInstanceImpl::getJSCallInvokerHolder() {
   if (!jsCallInvokerHolder_) {
