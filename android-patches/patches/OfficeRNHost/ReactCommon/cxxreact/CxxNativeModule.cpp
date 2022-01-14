--- ./ReactCommon/cxxreact/CxxNativeModule.cpp	2022-01-11 17:41:29.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/OfficeRNHost/ReactCommon/cxxreact/CxxNativeModule.cpp	2022-01-12 15:04:31.000000000 -0800
@@ -249,5 +249,18 @@
   }
 }
 
+// Adding this factory method so that Office Android can delay load binary reactnativejni
+std::unique_ptr<CxxNativeModule> Make(std::weak_ptr<Instance> instance,
+    std::string name,
+    xplat::module::CxxModule::Provider provider,
+    std::shared_ptr<MessageQueueThread> messageQueueThread)
+{
+    return std::make_unique<facebook::react::CxxNativeModule>(
+        instance,
+        std::move(name) /*ModuleName*/,
+        std::move(provider) /*Provider*/,
+        std::move(messageQueueThread));
+}
+
 } // namespace react
 } // namespace facebook
