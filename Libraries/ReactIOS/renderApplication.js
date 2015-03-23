/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule renderApplication
 */
'use strict';

var React = require('React');

var invariant = require('invariant');

function renderApplication(RootComponent, initialProps, rootTag) {
  invariant(
    rootTag,
    'Expect to have a valid rootTag, instead got ', rootTag
  );
   React.render(
    <RootComponent
      {...initialProps}
    />,
    rootTag
  );
}

module.exports = renderApplication;
