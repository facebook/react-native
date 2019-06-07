#pragma once

#include <memory>
#include <cxxreact/Bundle.h>
#include "JDevBundlesContainer.h"
#include <cxxreact/BundleLoader.h>

namespace facebook {
namespace react {

class FileBundleLoader : public BundleLoader {
  public:

    FileBundleLoader(jni::alias_ref<JavaDevBundlesContainer::javaobject> bundlesContainer);
    ~FileBundleLoader() {}

    std::unique_ptr<const Bundle> getBundle(std::string bundleURL) const override;
    std::string getBundleURLFromName(std::string bundleName) const override;

  private:
    std::unique_ptr<JDevBundlesContainer> bundlesContainer_;
    mutable std::string bundlesPath_;
};

} // namespace react
} // namespace facebook
