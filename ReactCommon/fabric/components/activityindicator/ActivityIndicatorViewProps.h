/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fabric/components/activityindicator/primitives.h>
#include <fabric/components/view/ViewProps.h>
#include <fabric/graphics/Color.h>

namespace facebook {
namespace react {

// TODO (T28334063): Consider for codegen.
class ActivityIndicatorViewProps final:
  public ViewProps {

public:
  ActivityIndicatorViewProps() = default;
  ActivityIndicatorViewProps(const ActivityIndicatorViewProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const bool animating {true};
  const SharedColor color {colorFromComponents({153/255.0, 153/255.0, 153/255.0, 1.0})}; // #999999
  const bool hidesWhenStopped {true};
  const ActivityIndicatorViewSize size {ActivityIndicatorViewSize::Small};
};

} // namespace react
} // namespace facebook
