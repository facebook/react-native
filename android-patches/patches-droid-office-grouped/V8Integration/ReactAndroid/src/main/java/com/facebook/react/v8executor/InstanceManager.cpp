--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\InstanceManager.cpp"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\InstanceManager.cpp"	2020-01-29 14:10:09.468888200 -0800
@@ -0,0 +1,101 @@
+#include <cxxreact/PlatformBundleInfo.h>
+#include <jsi/V8Runtime.h>
+#include <react/jni/ReadableNativeMap.h>
+#include <react/jni/JSLoader.h>
+
+#include "V8ExecutorFactory.h"
+
+#include "InstanceManager.h"
+
+namespace facebook { namespace react { namespace jsi {
+
+struct DefaultInstanceCallback final : public InstanceCallback
+{
+	void onBatchComplete() override {}
+	void incrementPendingJSCalls() override {}
+	void decrementPendingJSCalls() override {}
+};
+
+// If the provided url begins with "/" then it represents a file in file system.
+bool IsJSBundleFilePath(const std::string& bundleUrl)
+{
+	std::size_t index = bundleUrl.find("/");
+	if (index == 0)
+	{
+		return true;
+	}
+
+	return false;
+}
+
+std::shared_ptr<Instance> CreateReactInstance(
+	AAssetManager* assetManager,
+	std::string&& jsBundleFile,
+	std::vector<PlatformBundleInfo>&& platformBundles,
+	std::vector<std::tuple<std::string, facebook::xplat::module::CxxModule::Provider, std::shared_ptr<MessageQueueThread>>>&& cxxModules,
+	std::shared_ptr<MessageQueueThread>&& jsQueue,
+	std::shared_ptr<MessageQueueThread>&& /*nativeQueue*/) noexcept
+{
+	auto instance = std::make_shared<Instance>();
+
+	std::vector<std::unique_ptr<NativeModule>> modules;
+
+	// Add app provided modules.
+	for (auto& cxxModule : cxxModules)
+	{
+		modules.push_back(std::make_unique<CxxNativeModule>(instance,
+			move(std::get<0>(cxxModule)),
+			move(std::get<1>(cxxModule)),
+			move(std::get<2>(cxxModule))));
+	}
+
+	folly::dynamic v8Config = folly::dynamic::object;
+	std::unique_ptr<JSExecutorFactory> jsExecutorFactory{ folly::make_unique<V8ExecutorFactory>(std::move(v8Config))};
+	std::unique_ptr<ModuleRegistry> moduleRegistry{ std::make_unique<ModuleRegistry>(std::move(modules)) };
+
+	// Initialize bridge.
+	instance->initializeBridge(std::make_unique<DefaultInstanceCallback>(),
+		nullptr,
+		std::move(jsExecutorFactory),
+		std::move(jsQueue),
+		std::move(moduleRegistry));
+
+	// Load all required JS scripts.
+
+	// First load platform bundles.
+	for (auto& platformBundle : platformBundles)
+	{
+		if (!platformBundle.BundleUrl.empty())
+		{
+			std::unique_ptr<const JSBigString> script;
+			if (IsJSBundleFilePath(platformBundle.BundleUrl))
+			{
+				// Load from file system.
+				script = JSBigFileString::fromPath(platformBundle.BundleUrl);
+			}
+			else
+			{
+				// Load from Assets.
+				script = loadScriptFromAssets(assetManager, platformBundle.BundleUrl);
+			}
+			instance->loadScriptFromString(std::move(script), std::move(platformBundle.BundleUrl), true /*synchronously*/);
+		}
+	}
+
+	// Now load user bundle.
+	std::unique_ptr<const JSBigString> script;
+	if (IsJSBundleFilePath(jsBundleFile))
+	{
+		// Load from file system.
+		script = JSBigFileString::fromPath(jsBundleFile);
+	}
+	else
+	{
+		// Load from Assets.
+		script = loadScriptFromAssets(assetManager, jsBundleFile);
+	}
+	instance->loadScriptFromString(std::move(script), jsBundleFile, false);
+	return instance;
+}
+
+}}}//namespace facebook::react::jsi
