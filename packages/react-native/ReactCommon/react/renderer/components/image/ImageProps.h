/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/imagemanager/primitives.h>

namespace facebook::react {

// TODO (T28334063): Consider for codegen.
class ImageProps final : public ViewProps {
 public:
  ImageProps() = default;
  ImageProps(
      const PropsParserContext& context,
      const ImageProps& sourceProps,
      const RawProps& rawProps);

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

#pragma mark - Props

  ImageSources sources{};
  ImageSources defaultSources{};
  ImageResizeMode resizeMode{ImageResizeMode::Stretch};
  Float blurRadius{};
  EdgeInsets capInsets{};
  SharedColor tintColor{};
  std::string internal_analyticTag{};
};

} // namespace facebook::react
