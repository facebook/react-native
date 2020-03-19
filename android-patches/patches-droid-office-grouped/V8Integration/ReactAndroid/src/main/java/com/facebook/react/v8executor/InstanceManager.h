--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\InstanceManager.h"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\InstanceManager.h"	2020-01-29 14:10:09.468888200 -0800
@@ -0,0 +1,19 @@
+#pragma once
+#include <string>
+
+#include <android/asset_manager_jni.h>
+#include <cxxreact/CxxNativeModule.h>
+#include <cxxreact/Instance.h>
+#include <fb/fbjni.h>
+#include <folly/Memory.h>
+
+namespace facebook { namespace react { namespace jsi {
+
+std::shared_ptr<Instance> CreateReactInstance(
+	AAssetManager* assetManager,
+	std::string&& jsBundleFile,
+	std::vector<std::tuple<std::string, facebook::xplat::module::CxxModule::Provider, std::shared_ptr<MessageQueueThread>>>&& cxxModules,
+	std::shared_ptr<MessageQueueThread>&& jsQueue,
+	std::shared_ptr<MessageQueueThread>&& nativeQueue) noexcept;
+
+}}} //namespace facebook::react::jsi
