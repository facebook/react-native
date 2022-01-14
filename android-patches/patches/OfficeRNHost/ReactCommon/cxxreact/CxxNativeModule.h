--- ./ReactCommon/cxxreact/CxxNativeModule.h	2022-01-11 17:41:29.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/OfficeRNHost/ReactCommon/cxxreact/CxxNativeModule.h	2022-01-12 16:48:12.000000000 -0800
@@ -48,6 +48,12 @@
       unsigned int hookId,
       folly::dynamic &&args) override;
 
+  // Adding this factory method so that Office Android can delay load binary reactnativejni
+  static std::unique_ptr<CxxNativeModule> Make(std::weak_ptr<Instance> instance,
+                                               std::string name,
+                                               xplat::module::CxxModule::Provider provider,
+                                               std::shared_ptr<MessageQueueThread> messageQueueThread);
+
   static void setShouldWarnOnUse(bool value);
 
  private:
