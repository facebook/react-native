//
//  RCTLocalNotificationManager.h
//

#import <UIKit/UIKit.h>
#import "RCTBridge.h"

@interface RCTLocalNotificationManager : NSObject <RCTBridgeModule>

// You must manually call these methods from your app's delegate

+ (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)userNotificationSettings;
+ (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)localNotification;

@end
