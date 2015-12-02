// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>
#include <map>
#include <vector>
#include <jni.h>
#include <fb/Countable.h>
#include <fb/RefPtr.h>
#include "Value.h"
#include "Executor.h"
#include "MethodCall.h"

namespace folly {

struct dynamic;

}

namespace facebook {
namespace react {

class JSThreadState;
class Bridge : public Countable {
public:
  typedef std::function<void(std::vector<MethodCall>, bool isEndOfBatch)> Callback;

  Bridge(const RefPtr<JSExecutorFactory>& jsExecutorFactory, Callback callback);
  virtual ~Bridge();

  void executeJSCall(
    const std::string& moduleName,
    const std::string& methodName,
    const std::vector<folly::dynamic>& values);
  void executeApplicationScript(const std::string& script, const std::string& sourceURL);
  void setGlobalVariable(const std::string& propName, const std::string& jsonValue);
  bool supportsProfiling();
  void startProfiler(const std::string& title);
  void stopProfiler(const std::string& title, const std::string& filename);
private:
  Callback m_callback;
  std::unique_ptr<JSThreadState> m_threadState;
  // This is used to avoid a race condition where a proxyCallback gets queued after ~Bridge(),
  // on the same thread. In that case, the callback will try to run the task on m_callback which
  // will have been destroyed within ~Bridge(), thus causing a SIGSEGV.
  std::shared_ptr<bool> m_destroyed;
};

} }
