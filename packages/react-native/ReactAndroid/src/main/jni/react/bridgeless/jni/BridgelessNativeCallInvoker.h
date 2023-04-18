// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#include <functional>
#include <memory>

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/RuntimeExecutor.h>
#include <fb/fbjni.h>
#include <jsi/jsi.h>
#include <react/jni/JMessageQueueThread.h>

namespace facebook {
namespace react {

class BridgelessNativeCallInvoker : public CallInvoker {
 public:
  explicit BridgelessNativeCallInvoker(
      std::shared_ptr<JMessageQueueThread> messageQueueThread);
  void invokeAsync(std::function<void()> &&func) override;
  void invokeSync(std::function<void()> &&func) override;

 private:
  std::shared_ptr<JMessageQueueThread> messageQueueThread_;
};

} // namespace react
} // namespace facebook
