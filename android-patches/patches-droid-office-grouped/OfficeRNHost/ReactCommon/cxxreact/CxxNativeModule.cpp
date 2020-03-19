--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\cxxreact\\CxxNativeModule.cpp"	2020-01-30 13:55:48.514580900 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\cxxreact\\CxxNativeModule.cpp"	2020-01-29 14:10:09.747921600 -0800
@@ -142,7 +142,7 @@
     SystraceSection s(method.name.c_str());
     try {
       method.func(std::move(params), first, second);
-    } catch (const facebook::xplat::JsArgumentException& ex) {
+    } catch (const facebook::xplat::JsArgumentException&) {
       throw;
     } catch (std::exception& e) {
       LOG(ERROR) << "std::exception. Method call " << method.name.c_str() << " failed: " << e.what();
@@ -188,5 +188,18 @@
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
