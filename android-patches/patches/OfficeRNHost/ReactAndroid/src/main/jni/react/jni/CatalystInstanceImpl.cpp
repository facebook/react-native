--- "E:\\github\\rnm-63-fresh\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.cpp"	2020-10-27 20:26:17.024172000 -0700
+++ "E:\\github\\rnm-63\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.cpp"	2020-10-13 21:50:14.117742800 -0700
@@ -95,6 +95,7 @@
 void CatalystInstanceImpl::registerNatives() {
   registerHybrid({
       makeNativeMethod("initHybrid", CatalystInstanceImpl::initHybrid),
+      makeNativeMethod("createModuleRegistry", CatalystInstanceImpl::createModuleRegistry),
       makeNativeMethod(
           "initializeBridge", CatalystInstanceImpl::initializeBridge),
       makeNativeMethod(
@@ -127,26 +128,39 @@
           CatalystInstanceImpl::handleMemoryPressure),
       makeNativeMethod(
           "getRuntimeExecutor", CatalystInstanceImpl::getRuntimeExecutor),           
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
@@ -165,12 +179,13 @@
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
@@ -280,6 +295,10 @@
   instance_->handleMemoryPressure(pressureLevel);
 }
 
+jlong CatalystInstanceImpl::getPointerOfInstancePointer() {
+  return (jlong) (intptr_t) (&instance_);
+}
+
 jni::alias_ref<CallInvokerHolder::javaobject>
 CatalystInstanceImpl::getJSCallInvokerHolder() {
   if (!jsCallInvokerHolder_) {
