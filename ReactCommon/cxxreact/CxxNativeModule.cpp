// Copyright 2004-present Facebook. All Rights Reserved.

#include "CxxNativeModule.h"
#include "Instance.h"

#include <iterator>

#include <folly/json.h>

#include <cxxreact/JsArgumentHelpers.h>

using facebook::xplat::module::CxxModule;

namespace facebook {
namespace react {

std::function<void(folly::dynamic)> makeCallback(
    std::weak_ptr<Instance> instance, ExecutorToken token, const folly::dynamic& callbackId) {
  if (!callbackId.isInt()) {
    throw std::invalid_argument("Expected callback(s) as final argument");
  }

  auto id = callbackId.getInt();
  return [winstance = std::move(instance), token, id](folly::dynamic args) {
    if (auto instance = winstance.lock()) {
      instance->callJSCallback(token, id, std::move(args));
    }
  };
}

namespace {

/**
 * CxxModule::Callback accepts a vector<dynamic>, makeCallback returns
 * a callback that accepts a dynamic, adapt the second into the first.
 * TODO: Callback types should be made equal (preferably
 * function<void(dynamic)>) to avoid the extra copy and indirect call.
 */
CxxModule::Callback convertCallback(
    std::function<void(folly::dynamic)> callback) {
  return [callback = std::move(callback)](std::vector<folly::dynamic> args) {
    callback(folly::dynamic(std::make_move_iterator(args.begin()),
                            std::make_move_iterator(args.end())));
  };
}

}

CxxNativeModule::CxxNativeModule(std::weak_ptr<Instance> instance,
                                 std::unique_ptr<CxxModule> module)
  : instance_(instance)
  , module_(std::move(module))
  , methods_(module_->getMethods()) {
    module_->setInstance(instance);
  }

std::string CxxNativeModule::getName() {
  return module_->getName();
}

std::vector<MethodDescriptor> CxxNativeModule::getMethods() {
  std::vector<MethodDescriptor> descs;
  for (auto& method : methods_) {
    assert(method.func || method.syncFunc);
    descs.emplace_back(method.name, method.func ? "async" : "sync");
  }
  return descs;
}

folly::dynamic CxxNativeModule::getConstants() {
  folly::dynamic constants = folly::dynamic::object();
  for (auto& pair : module_->getConstants()) {
    constants.insert(std::move(pair.first), std::move(pair.second));
  }
  return constants;
}

bool CxxNativeModule::supportsWebWorkers() {
  // TODO(andrews): web worker support in cxxmodules
  return false;
}

void CxxNativeModule::invoke(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) {
  if (reactMethodId >= methods_.size()) {
    throw std::invalid_argument(
      folly::to<std::string>("methodId ", reactMethodId, " out of range [0..", methods_.size(), "]"));
  }
  if (!params.isArray()) {
    throw std::invalid_argument(
      folly::to<std::string>("method parameters should be array, but are ", params.typeName()));
  }

  CxxModule::Callback first;
  CxxModule::Callback second;

  const auto& method = methods_[reactMethodId];

  if (!method.func) {
    throw std::runtime_error(
      folly::to<std::string>("Method ", method.name,
                             " is synchronous but invoked asynchronously"));
  }

  if (params.size() < method.callbacks) {
    throw std::invalid_argument(
      folly::to<std::string>("Expected ", method.callbacks, " callbacks, but only ",
                             params.size(), " parameters provided"));
  }

  if (method.callbacks == 1) {
    first = convertCallback(
        makeCallback(instance_, token, params[params.size() - 1]));
  } else if (method.callbacks == 2) {
    first = convertCallback(
        makeCallback(instance_, token, params[params.size() - 2]));
    second = convertCallback(
        makeCallback(instance_, token, params[params.size() - 1]));
  }

  params.resize(params.size() - method.callbacks);

  // I've got a few flawed options here.  I can let the C++ exception
  // propogate, and the registry will log/convert them to java exceptions.
  // This lets all the java and red box handling work ok, but the only info I
  // can capture about the C++ exception is the what() string, not the stack.
  // I can std::terminate() the app.  This causes the full, accurate C++
  // stack trace to be added to logcat by debuggerd.  The java state is lost,
  // but in practice, the java stack is always the same in this case since
  // the javascript stack is not visible, and the crash is unfriendly to js
  // developers, but crucial to C++ developers.  The what() value is also
  // lost.  Finally, I can catch, log the java stack, then rethrow the C++
  // exception.  In this case I get java and C++ stack data, but the C++
  // stack is as of the rethrow, not the original throw, both the C++ and
  // java stacks always look the same.
  //
  // I am going with option 2, since that seems like the most useful
  // choice.  It would be nice to be able to get what() and the C++
  // stack.  I'm told that will be possible in the future.  TODO
  // mhorowitz #7128529: convert C++ exceptions to Java

  try {
    method.func(std::move(params), first, second);
  } catch (const facebook::xplat::JsArgumentException& ex) {
    // This ends up passed to the onNativeException callback.
    throw;
  } catch (...) {
    // This means some C++ code is buggy.  As above, we fail hard so the C++
    // developer can debug and fix it.
    std::terminate();
  }
}

MethodCallResult CxxNativeModule::callSerializableNativeHook(
    ExecutorToken token, unsigned int hookId, folly::dynamic&& args) {
  if (hookId >= methods_.size()) {
    throw std::invalid_argument(
      folly::to<std::string>("methodId ", hookId, " out of range [0..", methods_.size(), "]"));
  }

  const auto& method = methods_[hookId];

  if (!method.syncFunc) {
    throw std::runtime_error(
      folly::to<std::string>("Method ", method.name,
                             " is asynchronous but invoked synchronously"));
  }

  return method.syncFunc(std::move(args));
}

}
}
