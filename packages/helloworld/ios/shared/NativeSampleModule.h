#pragma once

#include <AppSpecsJSI.h>

#include <memory>
#include <string>

namespace facebook::react {

class NativeSampleModule
    : public NativeSampleModuleCxxSpec<NativeSampleModule> {
 public:
  NativeSampleModule(std::shared_ptr<CallInvoker> jsInvoker);

  std::string reverseString(jsi::Runtime& rt, std::string input);
};

} // namespace facebook::react
