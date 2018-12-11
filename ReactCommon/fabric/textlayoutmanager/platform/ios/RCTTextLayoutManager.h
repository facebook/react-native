/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <react/attributedstring/AttributedString.h>
#import <react/attributedstring/ParagraphAttributes.h>
#import <react/core/LayoutConstraints.h>
#import <react/graphics/Geometry.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * iOS-specific TextLayoutManager
 */
@interface RCTTextLayoutManager : NSObject

- (facebook::react::Size)
    measureWithAttributedString:
        (facebook::react::AttributedString)attributedString
            paragraphAttributes:
                (facebook::react::ParagraphAttributes)paragraphAttributes
              layoutConstraints:
                  (facebook::react::LayoutConstraints)layoutConstraints;

- (void)drawAttributedString:(facebook::react::AttributedString)attributedString
         paragraphAttributes:
             (facebook::react::ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame;

- (facebook::react::SharedEventEmitter)
    getEventEmitterWithAttributeString:
        (facebook::react::AttributedString)attributedString
                   paragraphAttributes:
                       (facebook::react::ParagraphAttributes)paragraphAttributes
                                 frame:(CGRect)frame
                               atPoint:(CGPoint)point;

@end

NS_ASSUME_NONNULL_END
