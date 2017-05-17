/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

jest.disableAutomock();

const React = require('React');
const ReactTestRenderer = require('react-test-renderer');
const ListView = require('ListView');
const Text = require('Text');

describe('ListView', () => {
  var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
  var datasource = ds.cloneWithRows(['John', 'Joel', 'James', 'Jimmy', 'Jackson', 'Jillian', 'Julie', 'Devin']);

  it('should render a ListView', () => {
    const component = ReactTestRenderer.create(
      <ListView
        dataSource={datasource}
        renderRow={rowData => <Text>{rowData}</Text>}
      />
    );

    expect(component).toMatchSnapshot();
  });

  xit('should be able to scroll', () => {
    // Not sure how to test this
    let ref;
    const component = ReactTestRenderer.create(
      <ListView
        ref={el => { ref = el; }}
        dataSource={datasource}
        renderRow={rowData => <Text>{rowData}</Text>}
      />
    );

    ref.scrollTo(4, 3, true);
  });
});
