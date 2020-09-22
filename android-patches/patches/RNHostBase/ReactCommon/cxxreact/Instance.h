--- "D:\\code\\work\\rn-62-db\\ReactCommon\\cxxreact\\Instance.h"	2020-04-30 21:53:47.085750800 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactCommon\\cxxreact\\Instance.h"	2020-04-30 23:14:27.446293700 -0700
@@ -39,6 +39,8 @@
 class RN_EXPORT Instance {
 public:
   ~Instance();
+
+  void setModuleRegistry(std::shared_ptr<ModuleRegistry> moduleRegistry);
   void initializeBridge(std::unique_ptr<InstanceCallback> callback,
                         std::shared_ptr<JSExecutorFactory> jsef,
                         std::shared_ptr<MessageQueueThread> jsQueue,
