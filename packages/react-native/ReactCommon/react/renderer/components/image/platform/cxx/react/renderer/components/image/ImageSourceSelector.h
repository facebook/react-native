/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/imagemanager/primitives.h>

namespace facebook::react {

static ImageSource getBestFitImageSource(
    const facebook::react::ImageSources& sources,
    const facebook::react::LayoutMetrics& layoutMetrics) {
  auto size = layoutMetrics.getContentFrame().size;
  auto scale = layoutMetrics.pointScaleFactor;

  if (sources.size() == 1) {
    auto source = sources[0];
    source.size = size;
    source.scale = scale;
    return source;
  }

  auto targetImageArea = size.width * size.height * scale * scale;
  auto bestFit = std::numeric_limits<Float>::infinity();

  auto bestSource = ImageSource{};

  for (const auto& source : sources) {
    auto sourceSize = source.size;
    auto sourceScale = source.scale == 0 ? scale : source.scale;
    auto sourceArea =
        sourceSize.width * sourceSize.height * sourceScale * sourceScale;

    auto fit = std::abs(1 - (sourceArea / targetImageArea));

    if (fit < bestFit) {
      bestFit = fit;
      bestSource = source;
    }
  }

  bestSource.size = size;
  bestSource.scale = scale;

  return bestSource;
}

} // namespace facebook::react
