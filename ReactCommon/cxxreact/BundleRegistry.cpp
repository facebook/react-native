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
  bundleExecutionEnvironments_.clear();
  bundles_.clear();
}

void BundleRegistry::runNewExecutionEnvironment(std::unique_ptr<const Bundle> initialBundle,
                                                std::function<void()> callback) {
  std::shared_ptr<BundleExecutionEnvironment> execEnv = std::make_shared<BundleExecutionEnvironment>();
  execEnv->valid = false;
  execEnv->jsQueue = jsQueueFactory_();
  bundles_.push_back(std::move(initialBundle));
  execEnv->initialBundle = std::weak_ptr<const Bundle>(bundles_.back());
  bundleExecutionEnvironments_.push_back(std::move(execEnv));

  execEnv = bundleExecutionEnvironments_.back();
  execEnv->jsQueue->runOnQueueSync([this, execEnv, callback]() mutable {
    execEnv->nativeToJsBridge = std::make_unique<NativeToJsBridge>(jsExecutorFactory_,
                                                                  moduleRegistry_,
                                                                  execEnv->jsQueue,
                                                                  callback_);
    // TODO: setupEnvironment + loadScript
    execEnv->valid = true;
    callback();
  });
}

void BundleRegistry::disposeExecutionEnvironments() {
  for (auto execEnv : bundleExecutionEnvironments_) {
    execEnv->nativeToJsBridge->destroy();
  }
}

std::weak_ptr<BundleRegistry::BundleExecutionEnvironment> BundleRegistry::getFirstExecutionEnvironemnt() {
  if (bundleExecutionEnvironments_.size() == 0) {
    throw std::runtime_error("Cannot get first BundleExecutionEnvironment");
  }

  return std::weak_ptr<BundleExecutionEnvironment>(bundleExecutionEnvironments_[0]);
}

bool BundleRegistry::hasExecutionEnvironemnt() {
  return bundleExecutionEnvironments_.size() > 0;
}

} // react
} // facebook
