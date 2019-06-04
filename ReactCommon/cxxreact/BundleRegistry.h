#pragma once

#include <memory>
#include "NativeToJsBridge.h"
#include "RAMBundle.h"
#include "BasicBundle.h"
#include "MessageQueueThread.h"
#include "BundleLoader.h"

namespace facebook {
namespace react {

struct InstanceCallback;
class ModuleRegistry;

class BundleRegistry {
  public:
    using LoadBundleLambda = std::function<void(std::string bundleName, bool inCurrentEnvironment)>;
    using GetModuleLambda = std::function<RAMBundle::Module(uint32_t moduleId, std::string bundleName)>;

    struct BundleExecutionEnvironment {
      std::shared_ptr<MessageQueueThread> jsQueue;
      std::unique_ptr<NativeToJsBridge> nativeToJsBridge;
      std::weak_ptr<const Bundle> initialBundle;
      bool valid;
    };

    BundleRegistry(JSExecutorFactory* jsExecutorFactory,
                   std::shared_ptr<ModuleRegistry> moduleRegistry,
                   std::shared_ptr<InstanceCallback> callback,
                   std::function<std::shared_ptr<MessageQueueThread>()> jsQueueFactory);
    BundleRegistry(const BundleRegistry&) = delete;
    BundleRegistry& operator=(const BundleRegistry&) = delete;
    ~BundleRegistry();

    /**
     * Create new `BundleExecutionEnvironment` with given identifier. The new BEE, will
     * have `jsQueue` and `nativeToJsBridge` initialized, without any bundle loaded.
     */
    void preloadEnvironment(std::string environmentId, std::function<void()> callback);
    /**
     * Load initial bundle into the already existing `BundleExecutionEnvironment`.
     * `BundleLoader` must be provided to allow for getting new bundles from assets or files, etc.
     */
    void runInPreloadedEnvironment(std::string environmentId,
                                   std::string initialBundleURL,
                                   std::unique_ptr<BundleLoader> bundleLoader);
    /**
     * Run initial bundle on debugger serviceWorker.
     */
    void runInRemoteDebugger(std::string environmentId, std::string sourceURL);
    /**
     * Dispose all `nativeToJsBridge`s and all `BundleExecutionEnvironment`s.
     */
    void disposeEnvironments();
    /**
     * Get `BundleExecutionEnvironment` for a given identifier. If no BEE was found
     * it will throw an error. Use `hasEnvironment` to check if the BEE for given identifier
     * exists.
     */
    std::weak_ptr<BundleExecutionEnvironment> getEnvironment(std::string environmentId);
    /**
     * Check if `BundleExecutionEnvironment` for a given identifier exists.
     */
    bool hasEnvironment(std::string environmentId);

  private:
    JSExecutorFactory* jsExecutorFactory_;
    std::shared_ptr<ModuleRegistry> moduleRegistry_;
    std::shared_ptr<InstanceCallback> callback_;
    std::function<std::shared_ptr<MessageQueueThread>()> jsQueueFactory_;

    std::map<std::string, std::shared_ptr<BundleExecutionEnvironment>> bundleEnvironments_;
    std::vector<std::shared_ptr<const Bundle>> bundles_;
    std::unique_ptr<BundleLoader> bundleLoader_;

    /**
     * Setup environment and load initial bundle. Should be called only once
     * per BundleEnvironemnt.
     */
    void evalInitialBundle(std::shared_ptr<BundleExecutionEnvironment> execEnv,
                           std::unique_ptr<const JSBigString> startupScript,
                           std::string sourceURL,
                           LoadBundleLambda loadBundle,
                           GetModuleLambda getModule);
    /**
     * Check bundle types and extract script from bundle for evaluation.
     * For BasicBundle it will be a whole bundle JS code and for RAM - only a startup code.
     */
    std::unique_ptr<const JSBigString> getScriptFromBundle(std::shared_ptr<const Bundle> bundle);
    /**
     * Create `loadBundle` lambda, which should be passed to `JSExecutor` to allow to load bundle
     * form JS code.
     */
    LoadBundleLambda makeLoadBundleLambda(std::string environmentId);
    /**
     * Create `getModule` lambda, which should be passed to `JSExecutor` to allow to load module
     * from RAM bundle with `nativeRequire`.
     */
    GetModuleLambda makeGetModuleLambda();
};

} // react
} // facebook

