--- "E:\\github\\rnm-63-fresh\\ReactCommon\\cxxreact\\CxxNativeModule.h"	2020-10-27 20:26:17.181166900 -0700
+++ "E:\\github\\rnm-63\\ReactCommon\\cxxreact\\CxxNativeModule.h"	2020-10-13 21:55:26.637861300 -0700
@@ -45,6 +45,12 @@
       unsigned int hookId,
       folly::dynamic &&args) override;
 
+  // Adding this factory method so that Office Android can delay load binary reactnativejni
+  static std::unique_ptr<CxxNativeModule> Make(std::weak_ptr<Instance> instance,
+                                               std::string name,
+                                               xplat::module::CxxModule::Provider provider,
+                                               std::shared_ptr<MessageQueueThread> messageQueueThread);
+
  private:
   void lazyInit();
 
