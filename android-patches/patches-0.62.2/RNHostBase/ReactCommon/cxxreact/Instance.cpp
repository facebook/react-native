--- "D:\\code\\work\\rn-62-db\\ReactCommon\\cxxreact\\Instance.cpp"	2020-04-30 21:53:47.085750800 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactCommon\\cxxreact\\Instance.cpp"	2020-04-30 23:15:40.653299100 -0700
@@ -38,6 +38,11 @@
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
