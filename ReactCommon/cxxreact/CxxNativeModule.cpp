// Copyright 2004-present Facebook. All Rights Reserved.

#include "CxxNativeModule.h"
#include "Instance.h"

#include <iterator>
#include <glog/logging.h>
#include <folly/json.h>

#include "JsArgumentHelpers.h"
#include "SystraceSection.h"
#include "MessageQueueThread.h"

using facebook::xplat::module::CxxModule;
namespace facebook {
namespace react {

std::function<void(folly::dynamic)> makeCallback(
    std::weak_ptr<Instance> instance, const folly::dynamic& callbackId) {
  if (!callbackId.isNumber()) {
    throw std::invalid_argument("Expected callback(s) as final argument");
  }

  auto id = callbackId.asInt();
  return [winstance = std::move(instance), id](folly::dynamic args) {
    if (auto instance = winstance.lock()) {
      instance->callJSCallback(id, std::move(args));
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

std::string CxxNativeModule::getName() {
  return name_;
}

std::vector<MethodDescriptor> CxxNativeModule::getMethods() {
  lazyInit();

  std::vector<MethodDescriptor> descs;
  for (auto& method : methods_) {
    descs.emplace_back(method.name, method.getType());
  }
  return descs;
}

folly::dynamic CxxNativeModule::getConstants() {
  lazyInit();

  if (!module_) {
    return nullptr;
  }

  folly::dynamic constants = folly::dynamic::object();
  for (auto& pair : module_->getConstants()) {
    constants.insert(std::move(pair.first), std::move(pair.second));
  }
  return constants;
}

void CxxNativeModule::invoke(unsigned int reactMethodId, folly::dynamic&& params, int callId) {
  if (reactMethodId >= methods_.size()) {
    throw std::invalid_argument(folly::to<std::string>("methodId ", reactMethodId,
        " out of range [0..", methods_.size(), "]"));
  }
  if (!params.isArray()) {
    throw std::invalid_argument(
      folly::to<std::string>("method parameters should be array, but are ", params.typeName()));
  }

  CxxModule::Callback first;
  CxxModule::Callback second;

  const auto& method = methods_[reactMethodId];

  if (!method.func) {
    throw std::runtime_error(folly::to<std::string>("Method ", method.name,
        " is synchronous but invoked asynchronously"));
  }

  if (params.size() < method.callbacks) {
    throw std::invalid_argument(folly::to<std::string>("Expected ", method.callbacks,
        " callbacks, but only ", params.size(), " parameters provided"));
  }

  if (method.callbacks == 1) {
    first = convertCallback(makeCallback(instance_, params[params.size() - 1]));
  } else if (method.callbacks == 2) {
    first = convertCallback(makeCallback(instance_, params[params.size() - 2]));
    second = convertCallback(makeCallback(instance_, params[params.size() - 1]));
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

  messageQueueThread_->runOnQueue([method, params=std::move(params), first, second, callId] () {
  #ifdef WITH_FBSYSTRACE
    if (callId != -1) {
      fbsystrace_end_async_flow(TRACE_TAG_REACT_APPS, "native", callId);
    }
  #endif
    SystraceSection s(method.name.c_str());
    try {
      method.func(std::move(params), first, second);
    } catch (const facebook::xplat::JsArgumentException& ex) {
      throw;
    } catch (std::exception& e) {
      LOG(ERROR) << "std::exception. Method call " << method.name.c_str() << " failed: " << e.what();
      std::terminate();
    } catch (std::string& error) {
      LOG(ERROR) << "std::string. Method call " << method.name.c_str() << " failed: " << error.c_str();
      std::terminate();
    } catch (...) {
      LOG(ERROR) << "Method call " << method.name.c_str() << " failed. unknown error";
      std::terminate();
    }
  });
}

MethodCallResult CxxNativeModule::callSerializableNativeHook(unsigned int hookId, folly::dynamic&& args) {
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

void CxxNativeModule::lazyInit() {
  if (module_ || !provider_) {
    return;
  }

  // TODO 17216751: providers should never return null modules
  module_ = provider_();
  provider_ = nullptr;
  if (module_) {
    methods_ = module_->getMethods();
    module_->setInstance(instance_);
  }
}

}
}
