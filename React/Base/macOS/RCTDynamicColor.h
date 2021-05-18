/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO(macOS GH#774)

#include <AppKit/AppKit.h>

/** A dynamic, theme aware subclass of NSColor.
 *  It is a tuple that contains two NSColors for light and dark
 *  theme appearances.  Like a semantic NSColor or an
 *  asset catalog named NSColor, the effective color values
 *  returned by the various methods and properties vary
 *  depending on the current [NSAppearance currentAppearance].
 */
@interface RCTDynamicColor : NSColor

/** Inits a RCTDynamicColor with a pair of NSColors
 *  @param aquaColor the color to use when the current appearance is not dark
 *  @param darkAquaColor the color to use when the current appearance is dark
 */
- (instancetype)initWithAquaColor:(NSColor *)aquaColor
                    darkAquaColor:(nullable NSColor *)darkAquaColor;

@end
