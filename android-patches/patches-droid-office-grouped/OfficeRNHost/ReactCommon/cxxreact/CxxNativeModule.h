--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\cxxreact\\CxxNativeModule.h"	2020-01-30 13:55:48.514580900 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\cxxreact\\CxxNativeModule.h"	2020-01-29 14:10:09.747921600 -0800
@@ -38,6 +38,12 @@
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
 
