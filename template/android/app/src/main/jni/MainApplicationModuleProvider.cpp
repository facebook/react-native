#include "MainApplicationModuleProvider.h"

#include <rncli.h>
#include <rncore.h>

namespace facebook {
namespace react {

std::shared_ptr<TurboModule> MainApplicationModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params) {
  // Here you can provide your own module provider for TurboModules coming from
  // either your application or from external libraries. The approach to follow
  // is similar to the following (for a library called `samplelibrary`:
  //
  // auto module = samplelibrary_ModuleProvider(moduleName, params);
  // if (module != nullptr) {
  //    return module;
  // }
  // return rncore_ModuleProvider(moduleName, params);

  // Module providers autolinked by RN CLI
  auto rncli_module = rncli_ModuleProvider(moduleName, params);
  if (rncli_module != nullptr) {
    return rncli_module;
  }

  return rncore_ModuleProvider(moduleName, params);
}

} // namespace react
} // namespace facebook
