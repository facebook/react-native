--- "D:\\code\\work\\rn-62-db\\ReactCommon\\cxxreact\\CxxNativeModule.cpp"	2020-04-30 21:53:47.083751200 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactCommon\\cxxreact\\CxxNativeModule.cpp"	2020-04-30 22:15:29.526938500 -0700
@@ -190,5 +190,18 @@
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
 }
 }
