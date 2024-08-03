/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <React/RCTUIKit.h>
#import <react/renderer/graphics/HostPlatformColor.h>
#import <vector>

facebook::react::ColorComponents RCTPlatformColorComponentsFromSemanticItems(
    std::vector<std::string>& semanticItems);
RCTUIColor* RCTPlatformColorFromSemanticItems( // [macOS]
    std::vector<std::string>& semanticItems);
RCTUIColor* RCTPlatformColorFromColor(const facebook::react::Color& color); // [macOS]
