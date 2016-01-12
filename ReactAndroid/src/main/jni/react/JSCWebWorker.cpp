// Copyright 2004-present Facebook. All Rights Reserved.

#include <unistd.h>
#include <mutex>
#include <pthread.h>
#include <unordered_map>

#include <fb/assert.h>
#include <fb/log.h>
#include <folly/Memory.h>
#include <jni/fbjni/Exceptions.h>
#include <jni/LocalReference.h>

#include "JSCWebWorker.h"
#include "JSCHelpers.h"
#include "jni/JMessageQueueThread.h"
#include "jni/JSLoader.h"
#include "jni/WebWorkers.h"
#include "Value.h"

#include <JavaScriptCore/JSValueRef.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

// TODO(9604425): thread safety
static std::unordered_map<JSContextRef, JSCWebWorker*> s_globalContextRefToJSCWebWorker;

JSCWebWorker::JSCWebWorker(int id, JSCWebWorkerOwner *owner, std::string scriptSrc) :
    id_(id),
    scriptName_(std::move(scriptSrc)),
    owner_(owner) {
  ownerMessageQueueThread_ = owner->getMessageQueueThread();
  FBASSERTMSGF(ownerMessageQueueThread_, "Owner MessageQueueThread must not be null");
  workerMessageQueueThread_ = WebWorkers::createWebWorkerThread(id, ownerMessageQueueThread_.get());
  FBASSERTMSGF(workerMessageQueueThread_, "Failed to create worker thread");

  workerMessageQueueThread_->runOnQueue([this] () {
    initJSVMAndLoadScript();
  });
}

JSCWebWorker::~JSCWebWorker() {
  // TODO(9604430): Implement tear down
}

void JSCWebWorker::postMessage(JSValueRef msg) {
  std::string msgString = Value(owner_->getContext(), msg).toJSONString();

  workerMessageQueueThread_->runOnQueue([this, msgString] () {
    if (isFinished()) {
      return;
    }

    JSValueRef args[] = { createMessageObject(context_, msgString) };
    Value onmessageValue = Object::getGlobalObject(context_).getProperty("onmessage");
    onmessageValue.asObject().callAsFunction(1, args);
  });
}

void JSCWebWorker::finish() {
  isFinished_ = true;
  // TODO(9604430): Implement tear down
}

bool JSCWebWorker::isFinished() {
  return isFinished_;
}

void JSCWebWorker::initJSVMAndLoadScript() {
  FBASSERTMSGF(!isFinished(), "Worker was already finished!");
  FBASSERTMSGF(!context_, "Worker JS VM was already created!");

  context_ = JSGlobalContextCreateInGroup(
      NULL, // use default JS 'global' object
      NULL // create new group (i.e. new VM)
  ); 
  s_globalContextRefToJSCWebWorker[context_] = this;
  
  // TODO(9604438): Protect against script does not exist
  std::string script = loadScriptFromAssets(scriptName_);
  evaluateScript(context_, String(script.c_str()), String(scriptName_.c_str()));

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
    *exception = makeJSCException(ctx, "postMessage got wrong number of arguments");
    return JSValueMakeUndefined(ctx);
  }
  JSValueRef msg = arguments[0];
  JSCWebWorker *webWorker = s_globalContextRefToJSCWebWorker.at(JSContextGetGlobalContext(ctx));
  webWorker->postMessageToOwner(msg);
  
  return JSValueMakeUndefined(ctx);
}

/*static*/
Object JSCWebWorker::createMessageObject(JSContextRef context, const std::string& msgJson) {
  Value rebornJSMsg = Value::fromJSON(context, String(msgJson.c_str()));
  Object messageObject = Object::create(context);
  messageObject.setProperty("data", rebornJSMsg);
  return std::move(messageObject);
}

}
}
