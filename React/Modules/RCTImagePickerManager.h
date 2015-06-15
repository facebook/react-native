//
//  RCTImagePickerManager.h
//  React
//
//  Created by David Mohl on 6/13/15.
//  Copyright © 2015 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "RCTBridgeModule.h"
#import <UIKit/UIKit.h>

@interface RCTImagePickerManager : UIViewController <RCTBridgeModule,UIImagePickerControllerDelegate,UINavigationControllerDelegate>
@end
