/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const React = require('react');
const SectionList = require('SectionList');

class MyListItem extends React.Component {
  props: {
    item: {
      title: string,
    },
  };
  render() {
    return <span />;
  }
}

class MyHeader extends React.Component {
  props: {
    section: {
      fooNumber: number,
    }
  };
  render() {
    return <span />;
  }
}

module.exports = {
  testGoodDataWithGoodCustomItemComponentFunction() {
    const sections = [{
      key: 'a', data: [{
        widgetCount: 3,
        key: 1,
      }],
    }];
    return (
      <SectionList
        ItemComponent={(props: {widgetCount: number}): React.Element<*> =>
          <MyListItem item={{title: props.widgetCount + ' Widgets'}} />
        }
        sections={sections}
      />
    );
  },

  testBadInheritedDefaultProp(): React.Element<*> {
    const sections = [];
    // $FlowExpectedError - bad windowSize type "big"
    return <SectionList ItemComponent={MyListItem} sections={sections} windowSize="big" />;
  },

  testMissingData(): React.Element<*> {
    // $FlowExpectedError - missing `sections` prop
    return <SectionList ItemComponent={MyListItem} />;
  },

  testBadSectionsShape(): React.Element<*> {
    const sections = [{
      key: 'a', items: [{
        title: 'foo',
        key: 1,
      }],
    }];
    // $FlowExpectedError - section missing `data` field
    return <SectionList ItemComponent={MyListItem} sections={sections} />;
  },

  testBadSectionsMetadata(): React.Element<*> {
    // $FlowExpectedError - section has bad meta data `fooNumber` field of type string
    const sections = [{
      key: 'a', fooNumber: 'string', data: [{
        title: 'foo',
        key: 1,
      }],
    }];
    return (
      <SectionList
        SectionHeaderComponent={MyHeader}
        ItemComponent={MyListItem}
        sections={sections}
      />
    );
  },
};
