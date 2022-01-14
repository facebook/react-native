--- ./ReactCommon/cxxreact/Instance.h	2022-01-11 17:41:29.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/OfficeRNHost/ReactCommon/cxxreact/Instance.h	2022-01-12 15:04:31.000000000 -0800
@@ -42,6 +42,8 @@
 class RN_EXPORT Instance {
  public:
   ~Instance();
+
+  void setModuleRegistry(std::shared_ptr<ModuleRegistry> moduleRegistry);
   void initializeBridge(
       std::unique_ptr<InstanceCallback> callback,
       std::shared_ptr<JSExecutorFactory> jsef,
