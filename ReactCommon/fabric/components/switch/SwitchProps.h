/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fabric/components/view/ViewProps.h>
#include <fabric/graphics/Color.h>

namespace facebook {
namespace react {

// TODO (T28334063): Consider for codegen.
class SwitchProps final:
  public ViewProps {

public:
  SwitchProps() = default;
  SwitchProps(const SwitchProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const bool value {false};
  const bool disabled {false};
  const SharedColor tintColor {};
  const SharedColor onTintColor {};
  const SharedColor thumbTintColor {};
};

} // namespace react
} // namespace facebook
