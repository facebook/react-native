// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

@protocol RCTNativeModule;

@interface RCTModuleMethod : NSObject

- (instancetype)initWithSelector:(SEL)selector
                    JSMethodName:(NSString *)JSMethodName
                           arity:(NSUInteger)arity
            blockArgumentIndexes:(NSIndexSet *)blockArgumentIndexes;

@property (readonly, nonatomic, assign) SEL selector;
@property (readonly, nonatomic, copy) NSString *JSMethodName;
@property (readonly, nonatomic, assign) NSUInteger arity;
@property (readonly, nonatomic, copy) NSIndexSet *blockArgumentIndexes;

@end
