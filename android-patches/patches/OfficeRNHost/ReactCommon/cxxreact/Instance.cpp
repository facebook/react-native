--- "E:\\github\\rnm-63-fresh\\ReactCommon\\cxxreact\\Instance.cpp"	2020-10-27 20:26:17.182168000 -0700
+++ "E:\\github\\rnm-63\\ReactCommon\\cxxreact\\Instance.cpp"	2020-10-13 21:55:46.414313400 -0700
@@ -39,6 +39,11 @@
   }
 }
 
+void Instance::setModuleRegistry(
+    std::shared_ptr<ModuleRegistry> moduleRegistry) {
+  moduleRegistry_ = std::move(moduleRegistry);
+}
+
 void Instance::initializeBridge(
     std::unique_ptr<InstanceCallback> callback,
     std::shared_ptr<JSExecutorFactory> jsef,
