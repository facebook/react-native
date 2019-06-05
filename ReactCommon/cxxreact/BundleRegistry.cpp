#include "BundleRegistry.h"
#include <folly/dynamic.h>

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
                                               std::string initialBundleURL,
                                               std::unique_ptr<BundleLoader> bundleLoader) {
  if (!bundleLoader_) {
    bundleLoader_ = std::move(bundleLoader);
  }
 
  std::shared_ptr<BundleExecutionEnvironment> execEnv = getEnvironment(environmentId).lock();
  auto initialBundle = bundleLoader_->getBundle(initialBundleURL);
  bundles_[initialBundleURL] = std::move(initialBundle);
  execEnv->initialBundle = std::weak_ptr<const Bundle>(bundles_[initialBundleURL]);

  execEnv->jsQueue->runOnQueueSync([this, execEnv, environmentId]() mutable {
    auto bundle = execEnv->initialBundle.lock();
    std::unique_ptr<const JSBigString> script = getScriptFromBundle(bundle);
    GetModuleLambda getModule = makeGetModuleLambda(environmentId);
    LoadBundleLambda loadBundle = makeLoadBundleLambda(environmentId);

    evalInitialBundle(execEnv,
                      std::move(script),
                      bundle->getSourceURL(),
                      loadBundle,
                      getModule);

    execEnv->valid = true;
  });
}

void BundleRegistry::runInRemoteDebugger(std::string environmentId, std::string sourceURL) {
  std::shared_ptr<BundleExecutionEnvironment> execEnv = getEnvironment(environmentId).lock();
  execEnv->nativeToJsBridge->loadScript(nullptr, sourceURL);
  
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

void BundleRegistry::evalInitialBundle(std::shared_ptr<BundleExecutionEnvironment> execEnv,
                                       std::unique_ptr<const JSBigString> startupScript,
                                       std::string sourceURL,
                                       LoadBundleLambda loadBundle,
                                       GetModuleLambda getModule) {
  // `nativeRequire`, which uses `getModule` must be always set on global
  // in `JSExecutor`, since even if the initial bundle is not RAM, we don't
  // know the format of other bundles.
  execEnv->nativeToJsBridge->setupEnvironmentSync(loadBundle, getModule);
  execEnv->nativeToJsBridge->loadScriptSync(std::move(startupScript),
                                            sourceURL);
}


std::unique_ptr<const JSBigString> BundleRegistry::getScriptFromBundle(std::shared_ptr<const Bundle> bundle) {
  if (bundle->getBundleType() == BundleType::FileRAMBundle ||
      bundle->getBundleType() == BundleType::IndexedRAMBundle) {
      std::shared_ptr<const RAMBundle> ramBundle
        = std::dynamic_pointer_cast<const RAMBundle>(bundle);
      if (!ramBundle) {
        throw std::runtime_error("Cannot cast Bundle to RAMBundle");
      }
      
      return ramBundle->getStartupScript();
    } else {
      std::shared_ptr<const BasicBundle> basicBundle
        = std::dynamic_pointer_cast<const BasicBundle>(bundle);
      if (!basicBundle) {
        throw std::runtime_error("Cannot cast Bundle to BasicBundle");
      }

      return basicBundle->getScript();
    }
}

BundleRegistry::GetModuleLambda BundleRegistry::makeGetModuleLambda(std::string environmentId) {
  return [this, environmentId](uint32_t moduleId, std::string bundleName) mutable {
     std::shared_ptr<const RAMBundle> ramBundle;

    // Special case for backward-compatibility with Metro: for main/index bundle
    // 2nd argument of `nativeRequire` is `0`, which gets mapped to `seg-0`. In that
    // case get module from BEE's `initialBundle`.
    if (bundleName == "seg-0") {
      std::shared_ptr<BundleExecutionEnvironment> execEnv = getEnvironment(environmentId).lock();
      std::shared_ptr<const Bundle> initialBundle = execEnv->initialBundle.lock();
      ramBundle = std::dynamic_pointer_cast<const RAMBundle>(initialBundle);
    } else {
      std::string bundleURL = bundleLoader_->getBundleURLFromName(bundleName);
      if (bundles_.find(bundleURL) != bundles_.end()) {
        ramBundle = std::dynamic_pointer_cast<const RAMBundle>(bundles_[bundleURL]);
      } else {
        throw std::runtime_error("Cannot find RAM bundle " + bundleURL);
      }
    }

    if (!ramBundle) {
      throw std::runtime_error("Bundle " +
                               bundleName +
                               " is not a RAM bundle - GetModuleLambda cannot be used on it");
    }

    return ramBundle->getModule(moduleId);
  };
}

BundleRegistry::LoadBundleLambda BundleRegistry::makeLoadBundleLambda(std::string environmentId) {
  return [this, environmentId](std::string bundleName, bool sync, bool inCurrentEnvironment) mutable {
    std::shared_ptr<BundleExecutionEnvironment> execEnv = getEnvironment(environmentId).lock();
    std::string bundleURL = bundleLoader_->getBundleURLFromName(bundleName);

    std::function<void()> loadAndEvalBundle = [this, bundleName, bundleURL, execEnv, sync]() mutable {
      std::unique_ptr<const Bundle> additionalBundle = bundleLoader_->getBundle(bundleURL);
      bundles_[bundleURL] = std::move(additionalBundle);
      std::shared_ptr<const Bundle> bundle = bundles_[bundleURL];
      std::unique_ptr<const JSBigString> script = getScriptFromBundle(bundle);

      execEnv->nativeToJsBridge->loadScriptSync(std::move(script),
                                                bundle->getSourceURL());
      if (!sync) {
        execEnv->nativeToJsBridge->callFunction("BundleRegistry",
                                                "bundleRegistryOnLoad",
                                                folly::dynamic::array(bundleName));
      }
    };

    if (sync) {
      execEnv->jsQueue->runOnQueueSync(std::move(loadAndEvalBundle));
    } else {
      execEnv->jsQueue->runOnQueue(std::move(loadAndEvalBundle));
    }
  };
}

} // react
} // facebook
