//
//  RCTDrawerView.h
//  HelloWorld
//
//  Created by Grégoire Van der Auwermeulen on 15.06.23.
//

#import <UIKit/UIKit.h>

@class RCTBridge;


@interface RCTDrawerView : UIView

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end
