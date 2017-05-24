#import "RCTVideoManager.h"
#import "RCTVideo.h"
#import "RCTBridge.h"
@import MediaPlayer;

@implementation RCTVideoManager

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[RCTVideo alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(src, NSString);
RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSInteger);

- (NSDictionary *)constantsToExport
{
  return @{@"ScaleNone": @(MPMovieScalingModeNone),
           @"ScaleToFill": @(MPMovieScalingModeFill),
           @"ScaleAspectFit": @(MPMovieScalingModeAspectFit),
           @"ScaleAspectFill": @(MPMovieScalingModeAspectFill)};
}

@end
