/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule renderApplication
 */
'use strict';

var PushNotificationIOS = require('PushNotificationIOS');
var React = require('React');

var invariant = require('invariant');

function renderApplication(RootComponent, initialProps, rootTag) {
  invariant(
    rootTag,
    'Expect to have a valid rootTag, instead got ', rootTag
  );
  var initialNotification = PushNotificationIOS.popInitialNotification();
  React.render(
    <RootComponent
      pushNotification={initialNotification}
      {...initialProps}
    />,
    rootTag
  );
}

module.exports = renderApplication;
