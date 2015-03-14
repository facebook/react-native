// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

@interface RCTTestRunner : NSObject

@property (nonatomic, copy) NSString *script;

- (instancetype)initWithApp:(NSString *)app;
- (void)runTest:(NSString *)moduleName;
- (void)runTest:(NSString *)moduleName initialProps:(NSDictionary *)initialProps expectErrorRegex:(NSRegularExpression *)expectErrorRegex;
- (void)runTest:(NSString *)moduleName initialProps:(NSDictionary *)initialProps expectErrorBlock:(BOOL(^)(NSString *error))expectErrorBlock;

@end
