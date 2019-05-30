#include "BundleRegistry.h"

namespace facebook {
namespace react {

BundleRegistry::BundleRegistry(JSExecutorFactory* jsExecutorFactory,
                               std::shared_ptr<ModuleRegistry> moduleRegistry,
                               std::shared_ptr<InstanceCallback> callback,
                               std::function<std::shared_ptr<MessageQueueThread>()> jsQueueFactory) {
  jsExecutorFactory_ = jsExecutorFactory;
  moduleRegistry_ = moduleRegistry;
  callback_ = callback;
  jsQueueFactory_ = jsQueueFactory;
}

BundleRegistry::~BundleRegistry() {
  bundleEnvironments_.clear();
  bundles_.clear();
}

void BundleRegistry::preloadEnvironment(std::string environmentId, std::function<void()> callback) {
  if (hasEnvironment(environmentId)) {
    throw std::runtime_error(
      folly::to<std::string>("Environment with id = ", environmentId, " already exists")
    );
  }
  std::shared_ptr<BundleExecutionEnvironment> execEnv = std::make_shared<BundleExecutionEnvironment>();
  execEnv->valid = false;
  execEnv->jsQueue = jsQueueFactory_();
  execEnv->initialBundle = std::weak_ptr<const Bundle>();
  bundleEnvironments_[environmentId] = std::move(execEnv);

  execEnv = bundleEnvironments_[environmentId];
  execEnv->jsQueue->runOnQueueSync([this, execEnv, callback]() mutable {
    execEnv->nativeToJsBridge = std::make_unique<NativeToJsBridge>(jsExecutorFactory_,
                                                                   moduleRegistry_,
                                                                   execEnv->jsQueue,
                                                                   callback_);
    callback();
  });
}

void BundleRegistry::runInPreloadedEnvironment(std::string environmentId,
                                               std::unique_ptr<const Bundle> initialBundle) {
  std::shared_ptr<BundleExecutionEnvironment> execEnv = getEnvironment(environmentId).lock();
  bundles_.push_back(std::move(initialBundle));
  execEnv->initialBundle = std::weak_ptr<const Bundle>(bundles_.back());

  execEnv->jsQueue->runOnQueueSync([this, execEnv]() mutable {
    auto bundle = execEnv->initialBundle.lock();
    if (bundle->getBundleType() == BundleType::FileRAMBundle ||
        bundle->getBundleType() == BundleType::IndexedRAMBundle) {
      std::shared_ptr<const RAMBundle> ramBundle
        = std::dynamic_pointer_cast<const RAMBundle>(bundle);
      if (!ramBundle) {
        throw std::runtime_error("Cannot cast Bundle to RAMBundle");
      }

      auto getModule = folly::Optional<GetModuleLambda>([ramBundle](uint32_t moduleId) {
        return ramBundle->getModule(moduleId);
      });
      
      evalInitialBundle(execEnv,
                        ramBundle->getStartupScript(),
                        ramBundle->getSourceURL(),
                        makeLoadBundleLambda(),
                        getModule);
    } else {
      std::shared_ptr<const BasicBundle> basicBundle
        = std::dynamic_pointer_cast<const BasicBundle>(bundle);
      if (!basicBundle) {
        throw std::runtime_error("Cannot cast Bundle to BasicBundle");
      }

      evalInitialBundle(execEnv,
                        basicBundle->getScript(),
                        basicBundle->getSourceURL(),
                        makeLoadBundleLambda(),
                        folly::Optional<GetModuleLambda>());
    }

    execEnv->valid = true;
  });
}

void BundleRegistry::evalInitialBundle(std::shared_ptr<BundleExecutionEnvironment> execEnv,
                                       std::unique_ptr<const JSBigString> startupScript,
                                       std::string sourceURL,
                                       LoadBundleLambda loadBundle,
                                       folly::Optional<GetModuleLambda> getModule) {
  execEnv->nativeToJsBridge->setupEnvironmentSync(loadBundle, getModule);
  execEnv->nativeToJsBridge->loadScriptSync(std::move(startupScript),
                                            sourceURL);
}

BundleRegistry::LoadBundleLambda BundleRegistry::makeLoadBundleLambda() {
  return [](std::string bundlePath, bool inCurrentEnvironment) {
    // TODO: provide actual implementation
    throw std::runtime_error("loadBundle is not implemented yet");
  };
}

void BundleRegistry::disposeEnvironments() {
  for (auto environment : bundleEnvironments_) {
    environment.second->nativeToJsBridge->destroy();
  }
}

std::weak_ptr<BundleRegistry::BundleExecutionEnvironment> BundleRegistry::getEnvironment(std::string environmentId) {
  if (!hasEnvironment(environmentId)) {
    throw std::runtime_error(
      folly::to<std::string>("Cannot get environment with id = ", environmentId)
    );
  }

  return std::weak_ptr<BundleExecutionEnvironment>(bundleEnvironments_[environmentId]);
}

bool BundleRegistry::hasEnvironment(std::string environmentId) {
  return bundleEnvironments_.find(environmentId) != bundleEnvironments_.end();
}

} // react
} // facebook
