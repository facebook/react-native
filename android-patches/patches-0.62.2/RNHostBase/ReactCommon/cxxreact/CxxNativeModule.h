--- "D:\\code\\work\\rn-62-db\\ReactCommon\\cxxreact\\CxxNativeModule.h"	2020-04-30 21:53:47.084750700 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactCommon\\cxxreact\\CxxNativeModule.h"	2020-04-30 22:14:14.012895400 -0700
@@ -40,6 +40,12 @@
   void invoke(unsigned int reactMethodId, folly::dynamic&& params, int callId) override;
   MethodCallResult callSerializableNativeHook(unsigned int hookId, folly::dynamic&& args) override;
 
+  // Adding this factory method so that Office Android can delay load binary reactnativejni
+  static std::unique_ptr<CxxNativeModule> Make(std::weak_ptr<Instance> instance,
+                                               std::string name,
+                                               xplat::module::CxxModule::Provider provider,
+                                               std::shared_ptr<MessageQueueThread> messageQueueThread);
+
 private:
   void lazyInit();
 
