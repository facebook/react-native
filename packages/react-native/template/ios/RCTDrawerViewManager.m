//
//  RCTDrawerViewManager.m
//  HelloWorld
//
//  Created by Grégoire Van der Auwermeulen on 15.06.23.
//

#import <React/RCTViewManager.h>
#import "RCTDrawerView.h"

@interface RCTDrawerViewManager : RCTViewManager
@end

@implementation RCTDrawerViewManager

RCT_EXPORT_MODULE(RCTDrawerView)

- (UIView *)view
{
  RCTDrawerView *view = [[RCTDrawerView alloc] initWithBridge:self.bridge];
  return view;
}




@end
