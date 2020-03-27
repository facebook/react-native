/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow-strict
 */

'use strict';

const React = require('react');
const ScrollView = require('../ScrollView');
const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');
const ReactTestRenderer = require('react-test-renderer');
const View = require('../../View/View');
const Text = require('../../../Text/Text');

describe('<ScrollView />', () => {
  it('should render as expected', () => {
    ReactNativeTestTools.expectRendersMatchingSnapshot(
      'ScrollView',
      () => (
        <ScrollView>
          <View>
            <Text>Hello World!</Text>
          </View>
        </ScrollView>
      ),
      () => {
        jest.dontMock('../ScrollView');
      },
    );
  });
  it('should mock native methods and instance methods when mocked', () => {
    jest.resetModules();
    jest.mock('../ScrollView');
    const ref = React.createRef();

    ReactTestRenderer.create(<ScrollView ref={ref} />);

    expect(ref.current != null && ref.current.measure).toBeInstanceOf(
      jest.fn().constructor,
    );
    expect(ref.current != null && ref.current.scrollTo).toBeInstanceOf(
      jest.fn().constructor,
    );
  });
});
