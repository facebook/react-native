// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTModuleIDs.h"

@implementation RCTModuleIDs

/**
  * Configures invocations from IOS -> JS. Simply passes the name of the key in
  * the configuration object `require('ReactIOSEventEmitter')`.
  */
+ (NSDictionary *)config
{
  return @{
    @"Dimensions": @{
      @"moduleID": @(RCTModuleIDDimensions),
      @"methods": @{
        @"set": @{
          @"methodID": @(RCTDimensionsSet),
          @"type": @"local"
        },
      }
    },

    @"RCTRenderingPerf": @{
      @"moduleID": @(RCTModuleIDRenderingPerf),
      @"methods": @{
        @"toggle": @{
          @"methodID": @(RCTRenderingPerfToggle),
          @"type": @"local"
        },
      }
    },

    @"RCTDeviceEventEmitter": @{
      @"moduleID": @(RCTModuleIDDeviceEventEmitter),
      @"methods": @{
        @"emit": @{
          @"methodID": @(RCTDeviceEventEmitterEmit),
          @"type": @"local"
        },
      }
    },

    @"RCTEventEmitter": @{
      @"moduleID": @(RCTModuleIDReactIOSEventEmitter),
      @"methods": @{
        @"receiveEvent": @{
          @"methodID": @(RCTEventEmitterReceiveEvent),
          @"type": @"local"
        },
        @"receiveTouches": @{
          @"methodID": @(RCTEventEmitterReceiveTouches),
          @"type": @"local"
        },
      }
    },

    @"RCTNativeAppEventEmitter": @{
      @"moduleID": @(RCTModuleIDNativeAppEventEmitter),
      @"methods": @{
        @"emit": @{
          @"methodID": @(RCTDeviceEventEmitterEmit),
          @"type": @"local"
        },
      }
    },

    @"RCTJSTimers": @{
      @"moduleID": @(RCTModuleIDJSTimers),
      @"methods": @{
        // Last argument is the callback.
        @"callTimers": @{
          @"methodID": @(RCTJSTimersCallTimers),
          @"type": @"local"
        },
      }
    },

    @"ReactIOS": @{
      @"moduleID": @(RCTModuleIDReactIOS),
      @"methods": @{
        @"unmountComponentAtNodeAndRemoveContainer": @{
          @"methodID": @(RCTReactIOSUnmountComponentAtNodeAndRemoveContainer),
          @"type": @"local"
        },
      }
    },

    @"Bundler": @{
      @"moduleID": @(RCTModuleIDBundler),
      @"methods": @{
        @"runApplication": @{
          @"methodID": @(RCTBundlerRunApplication),
          @"type": @"local"
        }
      }
    }
  };
}

@end

