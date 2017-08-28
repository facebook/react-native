/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EjectBanner
 */
'use strict';

var React = require('React');

class EjectBanner extends React.Component {
  render() {
    return (
      <div className="banner-crna-ejected">
        <h3>Project with Native Code Required</h3>
        <p>
          This page only applies to projects made with <code>react-native init</code> or to those made
          with Create React Native App which have since ejected. For more information about ejecting,
          please see the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on the Create React Native App repository.
        </p>
      </div>
    );
  }
}

module.exports = EjectBanner;
