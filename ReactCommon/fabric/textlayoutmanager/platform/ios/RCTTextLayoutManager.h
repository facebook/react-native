/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <fabric/core/LayoutConstraints.h>
#import <fabric/graphics/Geometry.h>
#import <fabric/attributedstring/AttributedString.h>
#import <fabric/attributedstring/ParagraphAttributes.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * iOS-specific TextLayoutManager
 */
@interface RCTTextLayoutManager : NSObject

- (facebook::react::Size)measureWithAttributedString:(facebook::react::AttributedString)attributedString
                                 paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                   layoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints;

- (void)drawAttributedString:(facebook::react::AttributedString)attributedString
         paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame;

@end

NS_ASSUME_NONNULL_END
