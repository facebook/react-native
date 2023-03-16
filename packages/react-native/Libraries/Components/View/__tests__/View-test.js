/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const render = require('../../../../jest/renderer');
const React = require('../React');
const View = require('../View');

jest.unmock('../View');
jest.unmock('../ViewNativeComponent');

describe('View', () => {
  it('default render', () => {
    const instance = render.create(<View />);

    expect(instance.toJSON()).toMatchInlineSnapshot(`<RCTView />`);
  });

  it('has displayName', () => {
    expect(View.displayName).toEqual('View');
  });
});

describe('View compat with web', () => {
  it('renders core props', () => {
    const props = {
      id: 'id',
      tabIndex: 0,
      testID: 'testID',
    };

    const instance = render.create(<View {...props} />);

    expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTView
        focusable={true}
        nativeID="id"
        testID="testID"
      />
    `);
  });

  it('renders "aria-*" props', () => {
    const props = {
      'aria-activedescendant': 'activedescendant',
      'aria-atomic': true,
      'aria-autocomplete': 'list',
      'aria-busy': true,
      'aria-checked': true,
      'aria-columncount': 5,
      'aria-columnindex': 3,
      'aria-columnspan': 2,
      'aria-controls': 'controls',
      'aria-current': 'current',
      'aria-describedby': 'describedby',
      'aria-details': 'details',
      'aria-disabled': true,
      'aria-errormessage': 'errormessage',
      'aria-expanded': true,
      'aria-flowto': 'flowto',
      'aria-haspopup': true,
      'aria-hidden': true,
      'aria-invalid': true,
      'aria-keyshortcuts': 'Cmd+S',
      'aria-label': 'label',
      'aria-labelledby': 'labelledby',
      'aria-level': 3,
      'aria-live': 'polite',
      'aria-modal': true,
      'aria-multiline': true,
      'aria-multiselectable': true,
      'aria-orientation': 'portrait',
      'aria-owns': 'owns',
      'aria-placeholder': 'placeholder',
      'aria-posinset': 5,
      'aria-pressed': true,
      'aria-readonly': true,
      'aria-required': true,
      role: 'main',
      'aria-roledescription': 'roledescription',
      'aria-rowcount': 5,
      'aria-rowindex': 3,
      'aria-rowspan': 3,
      'aria-selected': true,
      'aria-setsize': 5,
      'aria-sort': 'ascending',
      'aria-valuemax': 5,
      'aria-valuemin': 0,
      'aria-valuenow': 3,
      'aria-valuetext': '3',
    };

    const instance = render.create(<View {...props} />);

    expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTView
        accessibilityElementsHidden={true}
        accessibilityLabel="label"
        accessibilityLabelledBy={
          Array [
            "labelledby",
          ]
        }
        accessibilityLiveRegion="polite"
        accessibilityState={
          Object {
            "busy": true,
            "checked": true,
            "disabled": true,
            "expanded": true,
            "selected": true,
          }
        }
        accessibilityValue={
          Object {
            "max": 5,
            "min": 0,
            "now": 3,
            "text": "3",
          }
        }
        aria-activedescendant="activedescendant"
        aria-atomic={true}
        aria-autocomplete="list"
        aria-columncount={5}
        aria-columnindex={3}
        aria-columnspan={2}
        aria-controls="controls"
        aria-current="current"
        aria-describedby="describedby"
        aria-details="details"
        aria-errormessage="errormessage"
        aria-flowto="flowto"
        aria-haspopup={true}
        aria-invalid={true}
        aria-keyshortcuts="Cmd+S"
        aria-level={3}
        aria-modal={true}
        aria-multiline={true}
        aria-multiselectable={true}
        aria-orientation="portrait"
        aria-owns="owns"
        aria-placeholder="placeholder"
        aria-posinset={5}
        aria-pressed={true}
        aria-readonly={true}
        aria-required={true}
        aria-roledescription="roledescription"
        aria-rowcount={5}
        aria-rowindex={3}
        aria-rowspan={3}
        aria-setsize={5}
        aria-sort="ascending"
        importantForAccessibility="no-hide-descendants"
      />
    `);
  });

  it('renders styles', () => {
    const style = {
      display: 'flex',
      flex: 1,
      backgroundColor: 'white',
      marginInlineStart: 10,
      pointerEvents: 'none',
    };

    const instance = render.create(<View style={style} />);

    expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTView
        pointerEvents="none"
        style={
          Object {
            "backgroundColor": "white",
            "display": "flex",
            "flex": 1,
            "marginInlineStart": 10,
            "pointerEvents": "none",
          }
        }
      />
    `);
  });
});
