
/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * @generated by codegen project: GeneratePropsH.js
 */
#pragma once

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <vector>

namespace facebook::react {

class AndroidPopupMenuProps final : public ViewProps {
 public:
  AndroidPopupMenuProps() = default;
  AndroidPopupMenuProps(const PropsParserContext& context, const AndroidPopupMenuProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  std::vector<std::string> menuItems{};
};

} // namespace facebook::react
