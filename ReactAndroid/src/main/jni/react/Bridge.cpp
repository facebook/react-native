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

Bridge::Bridge(const RefPtr<JSExecutorFactory>& jsExecutorFactory, Callback callback) :
  m_callback(std::move(callback)),
  m_destroyed(std::shared_ptr<bool>(new bool(false)))
{
  auto destroyed = m_destroyed;
  m_jsExecutor = jsExecutorFactory->createJSExecutor([this, destroyed] (std::string queueJSON, bool isEndOfBatch) {
    if (*destroyed) {
      return;
    }
    m_callback(parseMethodCalls(queueJSON), isEndOfBatch);
  });
}

// This must be called on the same thread on which the constructor was called.
Bridge::~Bridge() {
  *m_destroyed = true;
  m_jsExecutor.reset();
}

void Bridge::executeApplicationScript(const std::string& script, const std::string& sourceURL) {
  m_jsExecutor->executeApplicationScript(script, sourceURL);
}

void Bridge::loadApplicationUnbundle(
    JSModulesUnbundle&& unbundle,
    const std::string& startupCode,
    const std::string& sourceURL) {
  m_jsExecutor->loadApplicationUnbundle(std::move(unbundle), startupCode, sourceURL);
}

void Bridge::flush() {
  if (*m_destroyed) {
    return;
  }
  auto returnedJSON = m_jsExecutor->flush();
  m_callback(parseMethodCalls(returnedJSON), true /* = isEndOfBatch */);
}

void Bridge::callFunction(const double moduleId, const double methodId, const folly::dynamic& arguments) {
  if (*m_destroyed) {
    return;
  }
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "Bridge.callFunction");
  #endif
  auto returnedJSON = m_jsExecutor->callFunction(moduleId, methodId, arguments);
  m_callback(parseMethodCalls(returnedJSON), true /* = isEndOfBatch */);
}

void Bridge::invokeCallback(const double callbackId, const folly::dynamic& arguments) {
  if (*m_destroyed) {
    return;
  }
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "Bridge.invokeCallback");
  #endif
  auto returnedJSON = m_jsExecutor->invokeCallback(callbackId, arguments);
  m_callback(parseMethodCalls(returnedJSON), true /* = isEndOfBatch */);
}

void Bridge::setGlobalVariable(const std::string& propName, const std::string& jsonValue) {
  m_jsExecutor->setGlobalVariable(propName, jsonValue);
}

bool Bridge::supportsProfiling() {
  return m_jsExecutor->supportsProfiling();
}

void Bridge::startProfiler(const std::string& title) {
  m_jsExecutor->startProfiler(title);
}

void Bridge::stopProfiler(const std::string& title, const std::string& filename) {
  m_jsExecutor->stopProfiler(title, filename);
}

void Bridge::handleMemoryPressureModerate() {
  m_jsExecutor->handleMemoryPressureModerate();
}

void Bridge::handleMemoryPressureCritical() {
  m_jsExecutor->handleMemoryPressureCritical();
}

} }
