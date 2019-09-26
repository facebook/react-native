#include "JSCallInvokerHolder.h"

namespace facebook {
namespace react {

JSCallInvokerHolder::JSCallInvokerHolder(
    std::shared_ptr<JSCallInvoker> jsCallInvoker)
    : _jsCallInvoker(jsCallInvoker) {}

std::shared_ptr<JSCallInvoker> JSCallInvokerHolder::getJSCallInvoker() {
  return _jsCallInvoker;
}

void JSCallInvokerHolder::registerNatives() {}

} // namespace react
} // namespace facebook
