// Copyright 2004-present Facebook. All Rights Reserved.

#include "Bridge.h"

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
using fbsystrace::FbSystraceAsyncFlow;
#endif

#include "Platform.h"

namespace facebook {
namespace react {

Bridge::Bridge(JSExecutorFactory* jsExecutorFactory, Callback callback) :
    m_callback(std::move(callback)),
    m_destroyed(std::make_shared<bool>(false)),
    m_mainJSMessageQueueThread(MessageQueues::getCurrentMessageQueueThread()) {
    m_mainExecutor = jsExecutorFactory->createJSExecutor(this);
}

// This must be called on the same thread on which the constructor was called.
Bridge::~Bridge() {
  CHECK(*m_destroyed) << "Bridge::destroy() must be called before deallocating the Bridge!";
}

void Bridge::loadApplicationScript(const std::string& script, const std::string& sourceURL) {
  m_mainExecutor->loadApplicationScript(script, sourceURL);
}

void Bridge::loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    const std::string& startupCode,
    const std::string& sourceURL) {
  m_mainExecutor->loadApplicationUnbundle(std::move(unbundle), startupCode, sourceURL);
}

void Bridge::callFunction(
    const double moduleId,
    const double methodId,
    const folly::dynamic& arguments,
    const std::string& tracingName) {
  if (*m_destroyed) {
    return;
  }

  #ifdef WITH_FBSYSTRACE
  int systraceCookie = m_systraceCookie++;
  FbSystraceAsyncFlow::begin(
      TRACE_TAG_REACT_CXX_BRIDGE,
      tracingName.c_str(),
      systraceCookie);
  #endif
  std::shared_ptr<bool> isDestroyed = m_destroyed;
  m_mainJSMessageQueueThread->runOnQueue([=] () {
    if (*isDestroyed) {
      return;
    }
    #ifdef WITH_FBSYSTRACE
    FbSystraceAsyncFlow::end(
        TRACE_TAG_REACT_CXX_BRIDGE,
        tracingName.c_str(),
        systraceCookie);
    FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, tracingName.c_str());
    #endif
    m_mainExecutor->callFunction(moduleId, methodId, arguments);
  });
}

void Bridge::invokeCallback(const double callbackId, const folly::dynamic& arguments) {
  if (*m_destroyed) {
    return;
  }

  #ifdef WITH_FBSYSTRACE
  int systraceCookie = m_systraceCookie++;
  FbSystraceAsyncFlow::begin(
      TRACE_TAG_REACT_CXX_BRIDGE,
      "<callback>",
      systraceCookie);
  #endif
  std::shared_ptr<bool> isDestroyed = m_destroyed;
  m_mainJSMessageQueueThread->runOnQueue([=] () {
    if (*isDestroyed) {
      return;
    }
    #ifdef WITH_FBSYSTRACE
    FbSystraceAsyncFlow::end(
        TRACE_TAG_REACT_CXX_BRIDGE,
        "<callback>",
        systraceCookie);
    FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "Bridge.invokeCallback");
    #endif
    m_mainExecutor->invokeCallback(callbackId, arguments);
  });
}

void Bridge::setGlobalVariable(const std::string& propName, const std::string& jsonValue) {
  m_mainExecutor->setGlobalVariable(propName, jsonValue);
}

void* Bridge::getJavaScriptContext() {
  return m_mainExecutor->getJavaScriptContext();
}

bool Bridge::supportsProfiling() {
  return m_mainExecutor->supportsProfiling();
}

void Bridge::startProfiler(const std::string& title) {
  m_mainExecutor->startProfiler(title);
}

void Bridge::stopProfiler(const std::string& title, const std::string& filename) {
  m_mainExecutor->stopProfiler(title, filename);
}

void Bridge::handleMemoryPressureModerate() {
  m_mainExecutor->handleMemoryPressureModerate();
}

void Bridge::handleMemoryPressureCritical() {
  m_mainExecutor->handleMemoryPressureCritical();
}

void Bridge::callNativeModules(const std::string& callJSON, bool isEndOfBatch) {
  if (*m_destroyed) {
    return;
  }
  m_callback(parseMethodCalls(callJSON), isEndOfBatch);
}

void Bridge::destroy() {
  *m_destroyed = true;
  m_mainExecutor->destroy();
  m_mainExecutor.reset();
}

} }
