#include "BasicBundle.h" 

namespace facebook {
namespace react {
    
BasicBundle::BasicBundle(std::unique_ptr<const JSBigString> script, std::string sourceURL) {
  sourceURL_ = sourceURL;
  script_ = std::move(script);
}

BundleType BasicBundle::getBundleType() const {
  return BundleType::BasicBundle;
}

std::string BasicBundle::getSourceURL() const {
  return sourceURL_;
}

std::unique_ptr<const JSBigString> BasicBundle::getScript() const {
  // It might be used multiple times, so we don't want to move it, but instead copy it.
  std::unique_ptr<JSBigBufferString> script =
    std::make_unique<JSBigBufferString>(script_->size());
  std::memcpy(script->data(), script_->c_str(), script_->size());
  return std::move(script);
}

} // react
} // facebook
