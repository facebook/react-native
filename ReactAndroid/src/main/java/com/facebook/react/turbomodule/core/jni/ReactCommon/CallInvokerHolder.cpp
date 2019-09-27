#include "CallInvokerHolder.h"

namespace facebook {
namespace react {

CallInvokerHolder::CallInvokerHolder(
    std::shared_ptr<CallInvoker> callInvoker)
    : _callInvoker(callInvoker) {}

std::shared_ptr<CallInvoker> CallInvokerHolder::getCallInvoker() {
  return _callInvoker;
}

void CallInvokerHolder::registerNatives() {}

} // namespace react
} // namespace facebook
