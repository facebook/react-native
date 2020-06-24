#import <Foundation/Foundation.h>

@interface RCTNetworkConfiguration : NSObject

/*
 *  @abstract customizeProtocolClasses
 */
+ (NSArray*)customizeProtocolClasses;
+ (void)setCustomizeProtocolClasses:(NSArray*)customizeProtocolClasses;

@end
