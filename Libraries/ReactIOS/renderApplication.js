/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule renderApplication
 * @flow
 */
'use strict';

var Portal = require('Portal');
var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');

var invariant = require('invariant');

function renderApplication<D, P, S>(
  RootComponent: ReactClass<D, P, S>,
  initialProps: P,
  rootTag: any
) {
  invariant(
    rootTag,
    'Expect to have a valid rootTag, instead got ', rootTag
  );
  React.render(
    <View style={styles.appContainer}>
      <RootComponent
        {...initialProps}
      />
      <Portal />
    </View>,
    rootTag
  );
}

var styles = StyleSheet.create({
  // This is needed so the application covers the whole screen
  // and therefore the contents of the Portal are not clipped.
  appContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

module.exports = renderApplication;
