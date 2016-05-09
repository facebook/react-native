// Copyright 2004-present Facebook. All Rights Reserved.

#include <atomic>
#include <functional>
#include <mutex>
#include <string>
#include <thread>
#include <queue>

#include <JavaScriptCore/JSValueRef.h>

#include "Value.h"

namespace facebook {
namespace react {

class MessageQueueThread;

/**
 * A class that can own the lifecycle, receive messages from, and dispatch messages
 * to JSCWebWorkers.
 */
class JSCWebWorkerOwner {
public:
  /**
   * Called when a worker has posted a message with `postMessage`.
   */
  virtual void onMessageReceived(int workerId, const std::string& message) = 0;
  virtual JSGlobalContextRef getContext() = 0;

  /**
   * Should return the owner's MessageQueueThread. Calls to onMessageReceived will be enqueued
   * on this thread.
   */
  virtual std::shared_ptr<MessageQueueThread> getMessageQueueThread() = 0;
};

/**
 * Implementation of a web worker for JSC. The web worker should be created from the owner's
 * (e.g., owning JSCExecutor instance) JS MessageQueueThread. The worker is responsible for
 * creating its own MessageQueueThread.
 *
 * During operation, the JSCExecutor should call postMessage **from its own MessageQueueThread**
 * to send messages to the worker. The worker will handle enqueueing those messages on its own
 * MessageQueueThread as appropriate. When the worker has a message to post to the owner, it will
 * enqueue a call to owner->onMessageReceived on the owner's MessageQueueThread.
 */
class JSCWebWorker {
public:
  explicit JSCWebWorker(int id, JSCWebWorkerOwner *owner, std::string script);
  ~JSCWebWorker();

  /**
   * Post a message to be received by the worker on its thread. This must be called from 
   * ownerMessageQueueThread_.
   */
  void postMessage(JSValueRef msg);

  /**
   * Synchronously quits the current worker and cleans up its VM.
   */
  void terminate();

  /**
   * Whether terminate() has been called on this worker.
   */
  bool isTerminated();

  static Object createMessageObject(JSContextRef context, const std::string& msgData);
private:
  void initJSVMAndLoadScript();
  void postRunnableToEventLoop(std::function<void()>&& runnable);
  void postMessageToOwner(JSValueRef result);
  void terminateOnWorkerThread();

  int id_;
  std::atomic_bool isTerminated_ = ATOMIC_VAR_INIT(false);
  std::string scriptName_;
  JSCWebWorkerOwner *owner_ = nullptr;
  std::shared_ptr<MessageQueueThread> ownerMessageQueueThread_;
  std::unique_ptr<MessageQueueThread> workerMessageQueueThread_;
  JSGlobalContextRef context_ = nullptr;

  static JSValueRef nativePostMessage(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
};

}
}
