--- "E:\\github\\rnm-63-fresh\\ReactCommon\\cxxreact\\Instance.h"	2020-10-27 20:26:17.182168000 -0700
+++ "E:\\github\\rnm-63\\ReactCommon\\cxxreact\\Instance.h"	2020-10-13 21:56:09.532647200 -0700
@@ -41,6 +41,8 @@
 class RN_EXPORT Instance {
  public:
   ~Instance();
+
+  void setModuleRegistry(std::shared_ptr<ModuleRegistry> moduleRegistry);
   void initializeBridge(
       std::unique_ptr<InstanceCallback> callback,
       std::shared_ptr<JSExecutorFactory> jsef,
