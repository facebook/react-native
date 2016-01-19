// Copyright 2004-present Facebook. All Rights Reserved.

#include "Bridge.h"

#include "Executor.h"
#include "MethodCall.h"

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
#endif

namespace facebook {
namespace react {

class JSThreadState {
public:
  JSThreadState(const RefPtr<JSExecutorFactory>& jsExecutorFactory, Bridge::Callback&& callback) :
    m_callback(callback)
  {
    m_jsExecutor = jsExecutorFactory->createJSExecutor([this, callback] (std::string queueJSON, bool isEndOfBatch) {
      m_callback(parseMethodCalls(queueJSON), false /* = isEndOfBatch */);
    });
  }

  void executeApplicationScript(const std::string& script, const std::string& sourceURL) {
    m_jsExecutor->executeApplicationScript(script, sourceURL);
  }

  void flush() {
    auto returnedJSON = m_jsExecutor->flush();
    m_callback(parseMethodCalls(returnedJSON), true /* = isEndOfBatch */);
  }

  void callFunction(const double moduleId, const double methodId, const folly::dynamic& arguments) {
    auto returnedJSON = m_jsExecutor->callFunction(moduleId, methodId, arguments);
    m_callback(parseMethodCalls(returnedJSON), true /* = isEndOfBatch */);
  }

  void invokeCallback(const double callbackId, const folly::dynamic& arguments) {
    auto returnedJSON = m_jsExecutor->invokeCallback(callbackId, arguments);
    m_callback(parseMethodCalls(returnedJSON), true /* = isEndOfBatch */);
  }

  void setGlobalVariable(const std::string& propName, const std::string& jsonValue) {
    m_jsExecutor->setGlobalVariable(propName, jsonValue);
  }

  bool supportsProfiling() {
    return m_jsExecutor->supportsProfiling();
  }

  void startProfiler(const std::string& title) {
    m_jsExecutor->startProfiler(title);
  }

  void stopProfiler(const std::string& title, const std::string& filename) {
    m_jsExecutor->stopProfiler(title, filename);
  }

  void handleMemoryPressureModerate() {
    m_jsExecutor->handleMemoryPressureModerate();
  }

  void handleMemoryPressureCritical() {
    m_jsExecutor->handleMemoryPressureCritical();
  }

private:
  std::unique_ptr<JSExecutor> m_jsExecutor;
  Bridge::Callback m_callback;
};

Bridge::Bridge(const RefPtr<JSExecutorFactory>& jsExecutorFactory, Callback callback) :
  m_callback(callback),
  m_destroyed(std::shared_ptr<bool>(new bool(false)))
{
  auto destroyed = m_destroyed;
  auto proxyCallback = [this, destroyed] (std::vector<MethodCall> calls, bool isEndOfBatch) {
    if (*destroyed) {
      return;
    }
    m_callback(std::move(calls), isEndOfBatch);
  };
  m_threadState.reset(new JSThreadState(jsExecutorFactory, std::move(proxyCallback)));
}

// This must be called on the same thread on which the constructor was called.
Bridge::~Bridge() {
  *m_destroyed = true;
  m_threadState.reset();
}

void Bridge::executeApplicationScript(const std::string& script, const std::string& sourceURL) {
  m_threadState->executeApplicationScript(script, sourceURL);
}

void Bridge::flush() {
  if (*m_destroyed) {
    return;
  }
  m_threadState->flush();
}

void Bridge::callFunction(const double moduleId, const double methodId, const folly::dynamic& arguments) {
  if (*m_destroyed) {
    return;
  }
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "Bridge.callFunction");
  #endif
  m_threadState->callFunction(moduleId, methodId, arguments);
}

void Bridge::invokeCallback(const double callbackId, const folly::dynamic& arguments) {
  if (*m_destroyed) {
    return;
  }
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "Bridge.invokeCallback");
  #endif
  m_threadState->invokeCallback(callbackId, arguments);
}

void Bridge::setGlobalVariable(const std::string& propName, const std::string& jsonValue) {
  m_threadState->setGlobalVariable(propName, jsonValue);
}

bool Bridge::supportsProfiling() {
  return m_threadState->supportsProfiling();
}

void Bridge::startProfiler(const std::string& title) {
  m_threadState->startProfiler(title);
}

void Bridge::stopProfiler(const std::string& title, const std::string& filename) {
  m_threadState->stopProfiler(title, filename);
}

void Bridge::handleMemoryPressureModerate() {
  m_threadState->handleMemoryPressureModerate();
}

void Bridge::handleMemoryPressureCritical() {
  m_threadState->handleMemoryPressureCritical();
}

} }
