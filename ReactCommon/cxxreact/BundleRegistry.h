#pragma once

#include <memory>
#include "NativeToJsBridge.h"
#include "RAMBundle.h"
#include "BasicBundle.h"
#include "MessageQueueThread.h"

namespace facebook {
namespace react {

struct InstanceCallback;
class ModuleRegistry;

class BundleRegistry {
  public:
    using LoadBundleLambda = std::function<void(std::string bundlePath, bool inCurrentEnvironment)>;
    using GetModuleLambda = std::function<RAMBundle::Module(uint32_t moduleId)>;

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

    void preloadEnvironment(std::string environmentId, std::function<void()> callback);
    void runInPreloadedEnvironment(std::string environmentId, std::unique_ptr<const Bundle> initialBundle);
    void disposeEnvironments();

    std::weak_ptr<BundleExecutionEnvironment> getEnvironment(std::string environmentId);
    bool hasEnvironment(std::string environmentId);

  private:
    std::map<std::string, std::shared_ptr<BundleExecutionEnvironment>> bundleEnvironments_;
    std::vector<std::shared_ptr<const Bundle>> bundles_;
    JSExecutorFactory* jsExecutorFactory_;
    std::shared_ptr<ModuleRegistry> moduleRegistry_;
    std::shared_ptr<InstanceCallback> callback_;
    std::function<std::shared_ptr<MessageQueueThread>()> jsQueueFactory_;

    /**
     * Setup environment and load initial bundle. Should be called only once
     * per BundleEnvironemnt.
     */
    void evalInitialBundle(std::shared_ptr<BundleExecutionEnvironment> execEnv,
                           std::unique_ptr<const JSBigString> startupScript,
                           std::string sourceURL,
                           LoadBundleLambda loadBundle,
                           folly::Optional<GetModuleLambda> getModule);

    LoadBundleLambda makeLoadBundleLambda(/* take pointer to BEE or initial Bundle */);
};

} // react
} // facebook

