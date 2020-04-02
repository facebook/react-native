#import <Cocoa/Cocoa.h>

@class RCTBridge;

@interface AppDelegate : NSObject <NSApplicationDelegate>

@property (nonatomic, readonly) RCTBridge *bridge;

@end
