//
// Extracted from https://github.com/dsibiski/react-native-userdefaults-ios
//

#import "RNUserDefaultsIOS.h"

@implementation RNUserDefaultsIOS

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(stringForKey:(NSString *)key callback:(RCTResponseSenderBlock)callback) {
    id response = [[NSUserDefaults standardUserDefaults] stringForKey:key];

    if (response) {
        callback(@[[NSNull null], response]);
    } else {
        callback(@[[NSNull null], [NSNull null]]);
    }
}

@end
