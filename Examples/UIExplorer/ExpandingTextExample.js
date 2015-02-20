/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ExpandingTextExample
 */
'use strict';

var React = require('react-native');
var {
  ExpandingText
} = React;

var LOREM = 'Lorem ipsum dolor sit amet, mea adipisci inimicus ex, paulo essent bonorum et ius, rebum deserunt mediocritatem ius ei.';

exports.title = '<ExpandingText>';
exports.description = 'Base component for rendering text that is truncated and can be expanded upon tap.';
exports.examples = [
{
  title: 'Expanding text (truncLength=20)',
  description: 'Setting the truncLength prop will cause the text to truncate to that character length',
  render: function() {
    return <ExpandingText truncLength={20} text={LOREM} />;
  }
}, {
  title: 'Expanding text (truncLength=80)',
  description: 'The higher the truncLength the more characters that will be shown by default',
  render: function() {
    return <ExpandingText truncLength={80} text={LOREM + LOREM} />;
  }
}, {
  title: 'Expanding text with custom style',
  description: 'You can style the text within the ExpandingText component',
  render: function() {
    return (
      <ExpandingText
        textStyle={{fontFamily: 'Verdana'}}
        truncLength={80}
        text={LOREM + LOREM}
      />
    );
  }
}, {
  title: 'See More button with custom style' ,
  description: 'You can also style just the See More button',
  render: function() {
    return (
      <ExpandingText
        seeMoreStyle={{color: 'red'}}
        truncLength={80}
        text={LOREM}
      />
    );
  }
}];
