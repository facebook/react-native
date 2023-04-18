// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#include <functional>
#include <memory>

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/RuntimeExecutor.h>
#include <fb/fbjni.h>
#include <jsi/jsi.h>

namespace facebook {
namespace react {

class BridgelessJSCallInvoker : public CallInvoker {
 public:
  explicit BridgelessJSCallInvoker(RuntimeExecutor runtimeExecutor);
  void invokeAsync(std::function<void()> &&func) override;
  void invokeSync(std::function<void()> &&func) override;

 private:
  RuntimeExecutor runtimeExecutor_;
};

} // namespace react
} // namespace facebook
