#import "VideoContentModes.h"
@import MediaPlayer;

@implementation VideoContentModes

- (NSDictionary *)constantsToExport
{
    return @{@"ScaleNone": @(MPMovieScalingModeNone),
             @"ScaleToFill": @(MPMovieScalingModeFill),
             @"ScaleAspectFit": @(MPMovieScalingModeAspectFit),
             @"ScaleAspectFill": @(MPMovieScalingModeAspectFill)};
}

@end
