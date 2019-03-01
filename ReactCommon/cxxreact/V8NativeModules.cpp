
#include <string>
#include "v8.h"
#include <v8helpers/V8Utils.h>
#include "V8NativeModules.h"
#include <folly/json.h>
#include <folly/Exception.h>
#include <folly/Memory.h>
#include <folly/String.h>
#include <folly/Conv.h>

using namespace facebook::react;
using namespace std;

namespace v8 {

auto newFromChar = [](Isolate *isolate, const char *body) {
    return String::NewFromUtf8(isolate, body);
};

V8NativeModules::V8NativeModules(std::shared_ptr<ModuleRegistry> moduleRegistry) :
        m_moduleRegistry(std::move(moduleRegistry)) { }

Global<Value> V8NativeModules::getModule(Isolate *isolate, Local<Context> context, const std::string &moduleName) {
  //LOGD("V8NativeModules::getModule moduleName %s", moduleName.c_str());
  if (!m_moduleRegistry) {
      return Global<Value>();
  }
  auto it = m_objects.find(moduleName);
  if (it != m_objects.end()) {
    return Global<Value>(isolate, it->second);
  }
  Local<Value> module = createModule(isolate, context, moduleName);
  if (module.IsEmpty()) {
    return Global<Value>();
  }
  Global<Value> globalValue;
  globalValue.Reset(isolate, module);
  auto result = m_objects.emplace(std::move(moduleName), std::move(globalValue)).first;
  return Global<Value>(isolate, result->second);
}

Local<Value> V8NativeModules::createModule(Isolate *isolate, Local<Context> context, const std::string &name) {
  if (m_genNativeModuleJS.IsEmpty()) {
    Local<Object> globalObj = context->Global();
    Local<Value> fbGenNativeModuleValue;
    //LOGD("V8NativeModules::createModule m_genNativeModuleJS");
    if(globalObj->Get(context, String::NewFromUtf8(isolate, "__fbGenNativeModule")).ToLocal(&fbGenNativeModuleValue)){
      //LOGD("V8NativeModules::createModule m_genNativeModuleJS1111");
      Local<Function> fbGenNativeModuleFunc = Local<Function>::Cast(fbGenNativeModuleValue);
      m_genNativeModuleJS.Reset(isolate, fbGenNativeModuleFunc);
    }
  }
  auto result = m_moduleRegistry->getConfig(name);

  if (!result.hasValue()) {
    //LOGD("V8NativeModules::createModule moduleName %s return NULL", name.c_str());
    return Local<Value>();
  }

  const std::string &json111 = folly::toJson(result->config);

  Local<Function> genNativeModuleJS = Local<Function>::New(isolate, m_genNativeModuleJS);
  Local<Integer> moduleId = Integer::NewFromUnsigned(isolate, result->index);
  Local<String> config = toLocalString(isolate, std::move(folly::toJson(result->config)));
  Local<Value> configArguments = JSON::Parse(context, config).ToLocalChecked();
  Local<Value> argv[2] = {configArguments, moduleId};
  Local<Value> res ;
  if(genNativeModuleJS->Call(context, context->Global(), 2, argv).ToLocal(&res)) {
    Local<Object> obj = Local<Object>::Cast(res);
    Local<Value> finalResult = obj->Get(context, newFromChar(isolate, "module")).ToLocalChecked();
    return finalResult;
  } else {
    CHECK(!res.IsEmpty()) << "Module returned from genNativeModule is null";
    return Local<Value>();
  }
}

void V8NativeModules::reset() {
  m_genNativeModuleJS.Reset();
  m_objects.clear();
}

}
