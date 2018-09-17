
#include <fabric/attributedstring/conversions.h>
#include <fabric/components/text/ParagraphLocalData.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

inline folly::dynamic toDynamic(const ParagraphLocalData &paragraphLocalData) {
  folly::dynamic newLocalData = folly::dynamic::object();
  newLocalData["attributedString"] = toDynamic(paragraphLocalData.getAttributedString());
  return newLocalData;
}

}
}
