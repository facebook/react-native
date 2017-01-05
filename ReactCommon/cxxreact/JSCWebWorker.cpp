// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCWebWorker.h"

#include <condition_variable>
#include <mutex>
#include <unordered_map>

#include <folly/Memory.h>
#include <glog/logging.h>

#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>

#include "MessageQueueThread.h"
#include "Platform.h"
#include "JSCUtils.h"

namespace facebook {
namespace react {

// TODO(9604425): thread safety
static std::unordered_map<JSContextRef, JSCWebWorker*> s_globalContextRefToJSCWebWorker;

JSCWebWorker::JSCWebWorker(int id, JSCWebWorkerOwner *owner, std::string scriptSrc) :
    id_(id),
    scriptName_(std::move(scriptSrc)),
    owner_(owner) {
  ownerMessageQueueThread_ = owner->getMessageQueueThread();
  CHECK(ownerMessageQueueThread_) << "Owner MessageQueue must not be null";
  workerMessageQueueThread_ = WebWorkerUtil::createWebWorkerThread(id, ownerMessageQueueThread_.get());
  CHECK(workerMessageQueueThread_) << "Failed to create worker thread";

  workerMessageQueueThread_->runOnQueue([this] () {
    initJSVMAndLoadScript();
  });
}


JSCWebWorker::~JSCWebWorker() {
  CHECK(isTerminated()) << "Didn't terminate the web worker before releasing it!";;
}

void JSCWebWorker::postMessage(JSValueRef msg) {
  std::string msgString = Value(owner_->getContext(), msg).toJSONString();

  workerMessageQueueThread_->runOnQueue([this, msgString] () {
    if (isTerminated()) {
      return;
    }

    JSValueRef args[] = { createMessageObject(context_, msgString) };
    Value onmessageValue = Object::getGlobalObject(context_).getProperty("onmessage");
    onmessageValue.asObject().callAsFunction(1, args);
  });
}

void JSCWebWorker::terminate() {
  if (isTerminated()) {
    return;
  }
  isTerminated_.store(true, std::memory_order_release);

  workerMessageQueueThread_->runOnQueueSync([this] {
    terminateOnWorkerThread();
  });
}

void JSCWebWorker::terminateOnWorkerThread() {
  s_globalContextRefToJSCWebWorker.erase(context_);
  JSC_JSGlobalContextRelease(context_);
  context_ = nullptr;
  workerMessageQueueThread_->quitSynchronous();
}

bool JSCWebWorker::isTerminated() {
  return isTerminated_.load(std::memory_order_acquire);
}

void JSCWebWorker::initJSVMAndLoadScript() {
  CHECK(!isTerminated()) << "Worker was already finished!";
  CHECK(!context_) << "Worker JS VM was already created!";

  context_ = JSC_JSGlobalContextCreateInGroup(
      false, // no support required for custom JSC
      NULL, // use default JS 'global' object
      NULL // create new group (i.e. new VM)
  );
  s_globalContextRefToJSCWebWorker[context_] = this;

  // TODO(9604438): Protect against script does not exist
  std::unique_ptr<const JSBigString> script = WebWorkerUtil::loadScriptFromAssets(scriptName_);
  evaluateScript(context_, jsStringFromBigString(context_, *script), String(context_, scriptName_.c_str()));

  installGlobalFunction(context_, "postMessage", nativePostMessage);
}

void JSCWebWorker::postMessageToOwner(JSValueRef msg) {
  std::string msgString = Value(context_, msg).toJSONString();
  ownerMessageQueueThread_->runOnQueue([this, msgString] () {
      owner_->onMessageReceived(id_, msgString);
  });
}

JSValueRef JSCWebWorker::nativePostMessage(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount != 1) {
    *exception = Value::makeError(ctx, "postMessage got wrong number of arguments");
    return Value::makeUndefined(ctx);
  }
  JSValueRef msg = arguments[0];
  JSCWebWorker *webWorker = s_globalContextRefToJSCWebWorker.at(JSC_JSContextGetGlobalContext(ctx));

  if (!webWorker->isTerminated()) {
    webWorker->postMessageToOwner(msg);
  }

  return Value::makeUndefined(ctx);
}

/*static*/
Object JSCWebWorker::createMessageObject(JSContextRef context, const std::string& msgJson) {
  Value rebornJSMsg = Value::fromJSON(context, String(context, msgJson.c_str()));
  Object messageObject = Object::create(context);
  messageObject.setProperty("data", rebornJSMsg);
  return messageObject;
}

}
}
