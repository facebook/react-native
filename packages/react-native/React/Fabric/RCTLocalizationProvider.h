/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>
#import <UIKit/UIKit.h>

@protocol RCTLocalizationProtocol <NSObject>

/*
 Call for other apps to use their own translation functions
 */
- (NSString *)localizedString:(NSString *)oldString withDescription:(NSString *)description;

@end

/*
 * It allows to set delegate for RCTLocalizationProvider so that we could ask APPs to do translations.
 * It's an experimental feature.
 */
RCT_EXTERN void setLocalizationDelegate(id<RCTLocalizationProtocol> delegate);

/*
 * It allows apps to provide their translated language pack in case the cannot do translation reactively.
 * It's an experimental feature.
 */
RCT_EXTERN void setLocalizationLanguagePack(NSDictionary<NSString *, NSString *> *pack);

@interface RCTLocalizationProvider : NSObject

+ (NSString *)RCTLocalizedString:(NSString *)oldString withDescription:(NSString *)description;

@end
