#include "FileBundleLoader.h"
#include <cxxreact/RecoverableError.h>
#include <cxxreact/IndexedRAMBundle.h>
#include <cxxreact/BasicBundle.h>

namespace facebook {
namespace react {

  FileBundleLoader::FileBundleLoader(jni::alias_ref<JavaDevBundlesContainer::javaobject> bundlesContainer) {
    bundlesContainer_ = std::make_unique<JDevBundlesContainer>(bundlesContainer);
  }

  std::unique_ptr<const Bundle> FileBundleLoader::getBundle(std::string bundleURL) const {
    std::string fileURL = bundlesContainer_->getFileURLBySourceURL(bundleURL);
    if (IndexedRAMBundle::isIndexedRAMBundle(bundleURL.c_str())) {
      return std::make_unique<IndexedRAMBundle>(fileURL, bundleURL);
    } else {
      std::unique_ptr<const JSBigFileString> script;
      RecoverableError::runRethrowingAsRecoverable<std::system_error>(
        [&fileURL, &script]() {
          script = JSBigFileString::fromPath(fileURL);
        }
      );
      return std::make_unique<BasicBundle>(std::move(script), bundleURL);
    }
  }

  std::string FileBundleLoader::getBundleURLFromName(std::string bundleName) const {
    return bundlesContainer_->getSourceURLByName(bundleName);
  }

} // namespace react
} // namespace facebook
