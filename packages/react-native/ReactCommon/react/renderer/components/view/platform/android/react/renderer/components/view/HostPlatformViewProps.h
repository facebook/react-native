/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/components/view/NativeDrawable.h>
#include <react/renderer/components/view/primitives.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Transform.h>

#include <optional>

namespace facebook::react {

class HostPlatformViewProps : public BaseViewProps {
 public:
  HostPlatformViewProps() = default;
  HostPlatformViewProps(
      const PropsParserContext &context,
      HostPlatformViewProps const &sourceProps,
      RawProps const &rawProps,
      bool shouldSetRawProps = true);

  void setProp(
      const PropsParserContext &context,
      RawPropsPropNameHash hash,
      const char *propName,
      RawValue const &value);

  void propsDiffMapBuffer(Props const *oldProps, MapBufferBuilder &builder)
      const override;

#pragma mark - Props

  std::optional<NativeDrawable> nativeBackground{};
  std::optional<NativeDrawable> nativeForeground{};

  bool focusable{false};
  bool hasTVPreferredFocus{false};
  bool needsOffscreenAlphaCompositing{false};
  bool renderToHardwareTextureAndroid{false};

#pragma mark - Convenience Methods

  bool getProbablyMoreHorizontalThanVertical_DEPRECATED() const;

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace facebook::react
