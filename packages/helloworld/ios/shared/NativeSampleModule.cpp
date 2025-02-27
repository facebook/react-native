#include "NativeSampleModule.h"

namespace facebook::react {

NativeSampleModule::NativeSampleModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeSampleModuleCxxSpec(std::move(jsInvoker)) {}

std::string NativeSampleModule::reverseString(
    jsi::Runtime& rt,
    std::string input) {
  return std::string(input.rbegin(), input.rend());
}

} // namespace facebook::react
