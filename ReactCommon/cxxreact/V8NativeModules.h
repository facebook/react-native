#ifndef V8_DEMO_V8NATIVEMODULES_H
#define V8_DEMO_V8NATIVEMODULES_H

#pragma once

#include <memory>
#include <string>

#include <cxxreact/ModuleRegistry.h>
#include <folly/Optional.h>
#include "v8.h"

using namespace facebook::react;
using namespace std;

namespace v8 {

class V8NativeModules {

public:
  explicit V8NativeModules(std::shared_ptr<ModuleRegistry> moduleRegistry);
  Global<Value> getModule(Isolate *isolate, Local<Context> context, const std::string &moduleName);
  void reset();

private:
  Global<Function> m_genNativeModuleJS;
  std::shared_ptr<ModuleRegistry> m_moduleRegistry;
  std::unordered_map<std::string, Global<Value>> m_objects;

  Local<Value> createModule(Isolate *isolate, Local<Context> context, const std::string &name) ;
};
}

#endif //V8_DEMO_V8NATIVEMODULES_H
