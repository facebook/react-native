/*
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTComponentEvent.h>

@interface RCTViewKeyboardEvent : RCTComponentEvent

#if TARGET_OS_OSX // TODO(macOS GH#774)
+ (NSDictionary *)bodyFromEvent:(NSEvent *)event;
+ (NSString *)keyFromEvent:(NSEvent *)event;
+ (instancetype)keyEventFromEvent:(NSEvent *)event reactTag:(NSNumber *)reactTag;
#endif // TODO(macOS GH#774)

@end
