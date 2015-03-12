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
  var pushNotification = initialProps.launchOptions &&
    initialProps.launchOptions.remoteNotification &&
    new PushNotificationIOS(initialProps.launchOptions.remoteNotification);
  React.render(
    <RootComponent
      pushNotification={pushNotification}
      {...initialProps}
    />,
    rootTag
  );
}

module.exports = renderApplication;
