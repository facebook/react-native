/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ExpandingText
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var TouchableWithoutFeedback = require('TouchableWithoutFeedback');
var View = require('View');

var truncate = require('truncate');

var styles = StyleSheet.create({
  boldText: {
    fontWeight: 'bold',
  },
});

/**
 * A react component for displaying text which supports truncating
 * based on a set truncLength.
 *
 * In the following example, the text will truncate
 * to show only the first 17 characters plus '...' with a See More button to
 * expand the text to its full length.
 *
 * ```
 * render: function() {
 *   return <ExpandingText truncLength={20} text={EXAMPLE_TEXT} />;
 * },
 * ```
 */
var ExpandingText = React.createClass({
  propTypes: {
    /**
     * Text to be displayed. It will be truncated if the character length
     * is greater than the `truncLength` property.
     */
    text: React.PropTypes.string,
    /**
     * The styles that will be applied to the text (both truncated and
     * expanded).
     */
    textStyle: Text.propTypes.style,
    /**
     * The styles that will be applied to the See More button. Default
     * is bold.
     */
    seeMoreStyle: Text.propTypes.style,
    /**
     * The caption that will be appended at the end, by default it is
     * `'See More'`.
     */
    seeMoreText: React.PropTypes.string,
    /**
     * The maximum character length for the text that will
     * be displayed by default. Note that ... will be
     * appended to the truncated text which is counted towards
     * the total truncLength of the default displayed string.
     * The default is 130.
     */
    truncLength: React.PropTypes.number,
  },

  getDefaultProps: function() {
    return {
      truncLength: 130,
      seeMoreText: 'See More',
      seeMoreStyle: styles.boldText,
    };
  },

  getInitialState: function() {
    return {
      truncated: true,
    };
  },

  onTapSeeMore: function() {
    this.setState({
      truncated: !this.state.truncated,
    });
  },

  isTruncated: function() {
    return (
      this.props.text.length > this.props.truncLength &&
      this.state.truncated
    );
  },

  getText: function() {
    var text = this.props.text;
    if (!this.isTruncated()) {
      return text;
    }

    return truncate(text, this.props.truncLength) + ' ';
  },

  renderSeeMore: function() {
    if (!this.isTruncated()) {
      return null;
    }

    return (
      <Text style={this.props.seeMoreStyle}>
        {this.props.seeMoreText}
      </Text>
    );
  },

  render: function() {
    return (
      <TouchableWithoutFeedback onPress={this.onTapSeeMore}>
        <View>
          <Text style={this.props.textStyle}>
            {this.getText()}
            {this.renderSeeMore()}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }
});

module.exports = ExpandingText;
