#include <folly/dynamic.h>
#include <jsiexecutor/jsireact/JSIExecutor.h>

namespace facebook { namespace react { namespace jsi {

class V8ExecutorFactory : public JSExecutorFactory {
public:
  V8ExecutorFactory(folly::dynamic&& v8Config);

  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  folly::dynamic m_v8Config;
};
}}} // namespace facebook::react::jsi
