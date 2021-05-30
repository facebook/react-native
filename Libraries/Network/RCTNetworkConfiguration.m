#import <React/RCTNetworkConfiguration.h>

@interface RCTNetworkConfiguration ()

@property (nonatomic, strong) NSArray  * customizeProtocolClasses;
@end

@implementation RCTNetworkConfiguration

+ (instancetype)sharedConfiguration
{
    static id _sharedInstance = nil;
    static dispatch_once_t oncePredicate;
    dispatch_once(&oncePredicate, ^{
        _sharedInstance = [[self alloc] init];
    });
    return _sharedInstance;
}

+ (NSArray*)customizeProtocolClasses{
    return [RCTNetworkConfiguration sharedConfiguration].customizeProtocolClasses;
}

+ (void)setCustomizeProtocolClasses:(NSArray *)customizeProtocolClasses{
    [RCTNetworkConfiguration sharedConfiguration].customizeProtocolClasses = customizeProtocolClasses;
}

@end
