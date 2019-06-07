#include "DeltaBundle.h"

namespace facebook {
namespace react {

DeltaBundle::DeltaBundle(std::shared_ptr<const DeltaBundleClient> deltaClient, std::string sourceURL) :
  deltaClient_(std::move(deltaClient)),
  sourceURL_(sourceURL) {}

std::string DeltaBundle::getSourceURL() const {
  return sourceURL_;
}

std::string DeltaBundle::getSourcePath() const {
  return sourceURL_;
}

std::unique_ptr<const JSBigString> DeltaBundle::getStartupScript() const {
  return deltaClient_->getStartupCode();
}

BundleType DeltaBundle::getBundleType() const {
  return BundleType::DeltaBundle;
}

RAMBundle::Module DeltaBundle::getModule(uint32_t moduleId, const char* bundlePrefix) const {
  auto module = deltaClient_->getModule(moduleId);
  if (bundlePrefix) {
    module.name = std::string(bundlePrefix) + '-' + module.name;
  }
  return module;
}

} // react
} // facebook
