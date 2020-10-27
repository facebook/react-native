/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const {Platform} = require('react-native');
const RNTesterBlock = require('./RNTesterBlock');
const RNTesterExampleFilter = require('./RNTesterExampleFilter');

const invariant = require('invariant');
import ExamplePage from './ExamplePage';

class RNTesterExampleContainer extends React.Component {
  renderExample(example, i) {
    // Filter platform-specific examples
    const {description, platform} = example;
    let {title} = example;
    if (platform) {
      if (Platform.OS !== platform) {
        return null;
      }
      title += ' (' + platform + ' only)';
    }
    return (
      <RNTesterBlock key={i} title={title} description={description}>
        {example.render()}
      </RNTesterBlock>
    );
  }

  render(): React.Element<any> {
    const {module} = this.props;
    if (module.simpleExampleContainer) {
      invariant(
        module.examples.length === 1,
        'If noExampleContainer is specified, only one example is allowed',
      );
      return (
        <ExamplePage
          title={module.title}
          description={module.description}
          android={!module.platform || module.platform === 'android'}
          ios={!module.platform || module.platform === 'ios'}
          documentationURL={module.documentationURL}
          category={module.category}>
          {module.examples[0].render()}
        </ExamplePage>
      );
    }
    if (module.examples.length === 1) {
      return (
        <ExamplePage
          title={module.title}
          description={module.description}
          android={!module.platform || module.platform === 'android'}
          ios={!module.platform || module.platform === 'ios'}
          documentationURL={module.documentationURL}
          category={module.category}>
          {module.examples[0].render()}
        </ExamplePage>
      );
    }

    const filter = ({example, filterRegex}) => filterRegex.test(example.title);

    const sections = [
      {
        data: module.examples,
        title: 'EXAMPLES',
        key: 'e',
      },
    ];

    return (
      <ExamplePage
        title={module.title}
        description={module.description}
        android={!module.platform || module.platform === 'android'}
        ios={!module.platform || module.platform === 'ios'}
        documentationURL={module.documentationURL}
        category={module.category}>
        <RNTesterExampleFilter
          testID="example_search"
          page="examples_page"
          hideFilterPills={true}
          sections={sections}
          filter={filter}
          render={({filteredSections}) =>
            filteredSections[0].data.map(this.renderExample)
          }
        />
      </ExamplePage>
    );
  }
}

module.exports = RNTesterExampleContainer;
