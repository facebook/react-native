#include "Bundle.h"
#include <folly/Bits.h>

namespace facebook {
namespace react {

static uint32_t constexpr RAMBundleMagicNumber = 0xFB0BD1E5;
static uint32_t constexpr BCBundleMagicNumber  = 0x6D657300;

BundleType Bundle::parseTypeFromHeader(const BundleHeader& header) {
  switch (folly::Endian::little(header.magic)) {
  case RAMBundleMagicNumber:
    return BundleType::IndexedRAMBundle;
  case BCBundleMagicNumber:
    return BundleType::BCBundle;
  default:
    return BundleType::BasicBundle;
  }
}

const char* Bundle::stringForBundleType(const BundleType& type) {
  switch (type) {
    case BundleType::BasicBundle:
      return "BundleType";
    case BundleType::IndexedRAMBundle:
      return "Indexed RAM Bundle";
    case BundleType::FileRAMBundle:
      return "File RAM Bundle";
    case BundleType::BCBundle:
      return "BC Bundle";
    case BundleType::DeltaBundle:
      return "Delta Bundle";
    default:
      return "";
  }
}

}  // namespace react
}  // namespace facebook
