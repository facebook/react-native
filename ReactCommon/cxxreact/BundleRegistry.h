#pragma once

#include <memory>
#include "NativeToJsBridge.h"
#include "Bundle.h"
#include "MessageQueueThread.h"

namespace facebook {
namespace react {

struct InstanceCallback;
class ModuleRegistry;

class BundleRegistry {
  public:
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

    void runNewExecutionEnvironment(std::unique_ptr<const Bundle> initialBundle,
                                    std::function<void()> callback);
    void disposeExecutionEnvironments();
    // TODO: get rid of this
    std::weak_ptr<BundleExecutionEnvironment> getFirstExecutionEnvironemnt();
    bool hasExecutionEnvironemnt();


  private:
    std::vector<std::shared_ptr<BundleExecutionEnvironment>> bundleExecutionEnvironments_;
    std::vector<std::shared_ptr<const Bundle>> bundles_;
    JSExecutorFactory* jsExecutorFactory_;
    std::shared_ptr<ModuleRegistry> moduleRegistry_;
    std::shared_ptr<InstanceCallback> callback_;
    std::function<std::shared_ptr<MessageQueueThread>()> jsQueueFactory_;
};

} // react
} // facebook

