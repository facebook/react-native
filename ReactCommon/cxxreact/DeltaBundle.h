#pragma once

#include <memory>
#include <istream>
#include "RAMBundle.h"
#include "JSBigString.h"
#include "DeltaBundleClient.h"

namespace facebook {
namespace react {

class DeltaBundle : public RAMBundle {
public:
  DeltaBundle(std::shared_ptr<const DeltaBundleClient> deltaClient,
              std::string sourceURL);
  ~DeltaBundle() {}

  std::string getSourceURL() const override;
  std::string getSourcePath() const override;
  std::unique_ptr<const JSBigString> getStartupScript() const override;
  Module getModule(uint32_t moduleId, const char* bundlePrefix) const override;
  BundleType getBundleType() const override;

private:
  std::shared_ptr<const DeltaBundleClient> deltaClient_;
  std::string sourceURL_;
};

} // react
} // facebook
