#include "DeltaBundleLoader.h"

namespace facebook {
namespace react {

DeltaBundleLoader::DeltaBundleLoader(std::shared_ptr<const DeltaBundleClient> deltaClient)
  : deltaClient_(deltaClient) {};

std::unique_ptr<const Bundle> DeltaBundleLoader::getBundle(std::string bundleURL) const {
  return std::make_unique<const DeltaBundle>(deltaClient_, bundleURL);
}

std::string DeltaBundleLoader::getBundleURLFromName(std::string bundleName) const {
  // Return bundleName itself, since we don't support Delta Bundle in multi-bundle mode.
  return bundleName;
}

} // namespace react
} // namespace facebook
