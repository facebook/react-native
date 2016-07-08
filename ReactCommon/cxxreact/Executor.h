// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>
#include <memory>
#include <string>
#include <vector>

#include <folly/dynamic.h>

#include "JSModulesUnbundle.h"

namespace facebook {
namespace react {

class JSExecutor;
class MessageQueueThread;

struct MethodCallResult {
  folly::dynamic result;
  bool isUndefined;
};

// This interface describes the delegate interface required by
// Executor implementations to call from JS into native code.
class ExecutorDelegate {
 public:
  virtual ~ExecutorDelegate() {}

  virtual void registerExecutor(std::unique_ptr<JSExecutor> executor,
                                std::shared_ptr<MessageQueueThread> queue) = 0;
  virtual std::unique_ptr<JSExecutor> unregisterExecutor(JSExecutor& executor) = 0;

  virtual std::vector<std::string> moduleNames() = 0;
  virtual folly::dynamic getModuleConfig(const std::string& name) = 0;
  virtual void callNativeModules(
    JSExecutor& executor, std::string callJSON, bool isEndOfBatch) = 0;
  virtual MethodCallResult callSerializableNativeHook(
    JSExecutor& executor, unsigned int moduleId, unsigned int methodId, folly::dynamic&& args) = 0;
};

class JSExecutorFactory {
public:
  virtual std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) = 0;
  virtual ~JSExecutorFactory() {}
};

// JSExecutor functions sometimes take large strings, on the order of
// megabytes.  Copying these can be expensive.  Introducing a
// move-only, non-CopyConstructible type will let the compiler ensure
// that no copies occur.  folly::MoveWrapper should be used when a
// large string needs to be curried into a std::function<>, which must
// by CopyConstructible.

class JSBigString {
public:
  JSBigString() = default;

  // Not copyable
  JSBigString(const JSBigString&) = delete;
  JSBigString& operator=(const JSBigString&) = delete;

  virtual ~JSBigString() {}

  virtual bool isAscii() const = 0;
  virtual const char* c_str() const = 0;
  virtual size_t size() const = 0;
};

// Concrete JSBigString implementation which holds a std::string
// instance.
class JSBigStdString : public JSBigString {
public:
  JSBigStdString(std::string str, bool isAscii=false)
    : m_isAscii(isAscii)
    , m_str(std::move(str)) {}

  bool isAscii() const override {
    return m_isAscii;
  }

  const char* c_str() const override {
    return m_str.c_str();
  }

  size_t size() const override {
    return m_str.size();
  }

private:
  bool m_isAscii;
  std::string m_str;
};

// Concrete JSBigString implementation which holds a heap-allocated
// buffer, and provides an accessor for writing to it.  This can be
// used to construct a JSBigString in place, such as by reading from a
// file.
class JSBigBufferString : public facebook::react::JSBigString {
public:
  JSBigBufferString(size_t size)
    : m_data(new char[size + 1])
    , m_size(size) {
    // Guarantee nul-termination.  The caller is responsible for
    // filling in the rest of m_data.
    m_data[m_size] = '\0';
  }

  ~JSBigBufferString() {
    delete[] m_data;
  }

  bool isAscii() const override {
    return true;
  }

  const char* c_str() const override {
    return m_data;
  }

  size_t size() const override {
    return m_size;
  }

  char* data() {
    return m_data;
  }

private:
  char* m_data;
  size_t m_size;
};

class JSExecutor {
public:
  /**
   * Execute an application script bundle in the JS context.
   */
  virtual void loadApplicationScript(std::unique_ptr<const JSBigString> script,
                                     std::string sourceURL) = 0;

  /**
   * Add an application "unbundle" file
   */
  virtual void setJSModulesUnbundle(std::unique_ptr<JSModulesUnbundle> bundle) = 0;

  /**
   * Executes BatchedBridge.callFunctionReturnFlushedQueue with the module ID,
   * method ID and optional additional arguments in JS. The executor is responsible
   * for using Bridge->callNativeModules to invoke any necessary native modules methods.
   */
  virtual void callFunction(const std::string& moduleId, const std::string& methodId, const folly::dynamic& arguments) = 0;

  /**
   * Executes BatchedBridge.invokeCallbackAndReturnFlushedQueue with the cbID,
   * and optional additional arguments in JS and returns the next queue. The executor
   * is responsible for using Bridge->callNativeModules to invoke any necessary
   * native modules methods.
   */
  virtual void invokeCallback(const double callbackId, const folly::dynamic& arguments) = 0;

  virtual void setGlobalVariable(std::string propName,
                                 std::unique_ptr<const JSBigString> jsonValue) = 0;
  virtual void* getJavaScriptContext() {
    return nullptr;
  }
  virtual bool supportsProfiling() {
    return false;
  }
  virtual void startProfiler(const std::string &titleString) {}
  virtual void stopProfiler(const std::string &titleString, const std::string &filename) {}
  virtual void handleMemoryPressureUiHidden() {}
  virtual void handleMemoryPressureModerate() {}
  virtual void handleMemoryPressureCritical() {
    handleMemoryPressureModerate();
  }
  virtual void destroy() {}
  virtual ~JSExecutor() {}
};

} }
