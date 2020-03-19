--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.cpp"	2020-01-30 13:55:48.476581100 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\react\\jni\\CatalystInstanceImpl.cpp"	2020-02-14 10:59:16.805390300 -0800
@@ -20,6 +20,7 @@
 #include <cxxreact/ModuleRegistry.h>
 #include <cxxreact/RecoverableError.h>
 #include <cxxreact/RAMBundleRegistry.h>
+#include <fb/Environment.h>
 #include <fb/log.h>
 #include <fb/fbjni/ByteBuffer.h>
 #include <folly/dynamic.h>
@@ -101,6 +102,7 @@
 void CatalystInstanceImpl::registerNatives() {
   registerHybrid({
     makeNativeMethod("initHybrid", CatalystInstanceImpl::initHybrid),
+    makeNativeMethod("createModuleRegistry", CatalystInstanceImpl::createModuleRegistry),
     makeNativeMethod("initializeBridge", CatalystInstanceImpl::initializeBridge),
     makeNativeMethod("jniExtendNativeModules", CatalystInstanceImpl::extendNativeModules),
     makeNativeMethod("jniSetSourceURL", CatalystInstanceImpl::jniSetSourceURL),
@@ -114,22 +116,34 @@
     makeNativeMethod("getJavaScriptContext", CatalystInstanceImpl::getJavaScriptContext),
     makeNativeMethod("getJSCallInvokerHolder", CatalystInstanceImpl::getJSCallInvokerHolder),
     makeNativeMethod("jniHandleMemoryPressure", CatalystInstanceImpl::handleMemoryPressure),
+    makeNativeMethod("getPointerOfInstancePointer", CatalystInstanceImpl::getPointerOfInstancePointer),
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
     JavaScriptExecutorHolder* jseh,
-    jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue,
-    jni::alias_ref<JavaMessageQueueThread::javaobject> nativeModulesQueue,
-    jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
-    jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject> cxxModules) {
-  // TODO mhorowitz: how to assert here?
-  // Assertions.assertCondition(mBridge == null, "initializeBridge should be called once");
-  moduleMessageQueue_ = std::make_shared<JMessageQueueThread>(nativeModulesQueue);
+    jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue) {
 
   // This used to be:
   //
@@ -147,17 +161,11 @@
   // don't need jsModuleDescriptions any more, all the way up and down the
   // stack.
 
-  moduleRegistry_ = std::make_shared<ModuleRegistry>(
-    buildNativeModuleList(
-       std::weak_ptr<Instance>(instance_),
-       javaModules,
-       cxxModules,
-       moduleMessageQueue_));
-
   instance_->initializeBridge(
     std::make_unique<JInstanceCallback>(
     callback,
     moduleMessageQueue_),
+    nullptr, // Use default executor delegate
     jseh->getExecutorFactory(),
     folly::make_unique<JMessageQueueThread>(jsQueue),
     moduleRegistry_);
@@ -268,6 +276,10 @@
   instance_->handleMemoryPressure(pressureLevel);
 }
 
+jlong CatalystInstanceImpl::getPointerOfInstancePointer() {
+  return (jlong) (intptr_t) (&instance_);
+}
+
 jni::alias_ref<JSCallInvokerHolder::javaobject> CatalystInstanceImpl::getJSCallInvokerHolder() {
   if (!javaInstanceHolder_) {
     jsCallInvoker_ = std::make_shared<BridgeJSCallInvoker>(instance_);
