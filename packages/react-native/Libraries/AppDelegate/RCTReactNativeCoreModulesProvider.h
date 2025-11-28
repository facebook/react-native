//
//  RCTReactNativeCoreModulesProvider.h
//  React-RCTAppDelegate
//
//  Created by Riccardo Cipolleschi on 10/11/2025.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTReactNativeCoreModulesProvider : NSObject

+ (Class) reactNativeCoreModuleForName:(const char *)name;

@end

NS_ASSUME_NONNULL_END
