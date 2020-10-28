--- "E:\\github\\rnm-63-fresh\\ReactCommon\\cxxreact\\CxxNativeModule.cpp"	2020-10-27 20:26:17.181166900 -0700
+++ "E:\\github\\rnm-63\\ReactCommon\\cxxreact\\CxxNativeModule.cpp"	2020-10-13 21:55:00.437153500 -0700
@@ -209,5 +209,18 @@
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
