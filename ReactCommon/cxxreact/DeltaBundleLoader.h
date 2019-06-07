#pragma once

#include <memory>
#include <cxxreact/Bundle.h>
#include <cxxreact/BundleLoader.h>
#include "DeltaBundle.h"

namespace facebook {
namespace react {

class DeltaBundleLoader : public BundleLoader {
 public:
  DeltaBundleLoader(std::shared_ptr<const DeltaBundleClient> deltaClient);
  ~DeltaBundleLoader() {}

  std::unique_ptr<const Bundle> getBundle(std::string bundleURL) const override;
  std::string getBundleURLFromName(std::string bundleName) const override;
  
 private:
  std::shared_ptr<const DeltaBundleClient> deltaClient_;
};

} // namespace react
} // namespace facebook
