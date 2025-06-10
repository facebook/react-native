#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>

@interface RCTTextView : UIView

@property (nonatomic, copy) NSString *text;
@property (nonatomic, assign) BOOL dynamicTypeEnabled;
@property (nonatomic, copy) NSString *textStyle;

@end