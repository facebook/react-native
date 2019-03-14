/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDatePickerComponentView.h"

#import <react/components/rncore/EventEmitters.h>
#import <react/components/rncore/Props.h>
#import <react/components/rncore/ShadowNodes.h>

using namespace facebook::react;

@implementation RCTDatePickerComponentView {
    UIDatePicker *_datePicker;
    NSDate *_previousDate;
}

static UIDatePickerMode convertDatePickerMode(const DatePickerMode &size)
{
    switch (size) {
        case facebook::react::DatePickerMode::Date:
            return UIDatePickerModeDate;
        case facebook::react::DatePickerMode::Time:
            return UIDatePickerModeTime;
        case facebook::react::DatePickerMode::Datetime:
            return UIDatePickerModeDateAndTime;
    }
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const DatePickerProps>();
        _props = defaultProps;
        
        _datePicker = [[UIDatePicker alloc] initWithFrame:self.bounds];
        _datePicker.datePickerMode = convertDatePickerMode(defaultProps->mode);
        _datePicker.minuteInterval = defaultProps->minuteInterval;
//        _datePicker.date = defaultProps->date;
//        _previousDate = defaultProps->date;
        
        [_datePicker addTarget:self action:@selector(onChange:) forControlEvents:UIControlEventValueChanged];

        self.contentView = _datePicker;
    }
    
    return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentHandle)componentHandle
{
    return DatePickerShadowNode::Handle();
}

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
    const auto &oldDatePickerProps = *std::static_pointer_cast<const DatePickerProps>(oldProps ?: _props);
    const auto &newDatePickerProps = *std::static_pointer_cast<const DatePickerProps>(props);
    
    [super updateProps:props oldProps:oldProps];
    
//    // `date`
//    if (oldDatePickerProps.date != newDatePickerProps.date) {
//        _datePicker = newDatePickerProps.date;
//        _previousDate = newDatePickerProps.date;
//    }
//
    // `mode`
    if (oldDatePickerProps.mode != newDatePickerProps.mode) {
        _datePicker.datePickerMode = convertDatePickerMode(newDatePickerProps.mode);
    }
    
    // `minuteInterval`
    if (oldDatePickerProps.minuteInterval != newDatePickerProps.minuteInterval) {
        _datePicker.minuteInterval = newDatePickerProps.minuteInterval;
    }
}

- (void)onChange:(UIDatePicker *)sender
{
    if ([sender.date isEqual:_previousDate]) {
        return;
    }
    _previousDate = sender.date;
    
    // emit something, probably.
    NSLog(@"%@", sender.date);
}

@end
