/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 * 
 * Facebook reserves all rights not expressly granted.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 * @providesModule PageBlock
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  Text,
  View,
} = React;

var PageBlock = React.createClass({
  propTypes: {
    title: React.PropTypes.string,
    description: React.PropTypes.string,
  },

  getInitialState: function() {
    return {
    	description: (null: ?string),
    	title:(null: ?string),
    };
  },

  render: function() {
    var description,title;
    if (this.props.description) {
      description =
        <Text style={styles.descriptionText}>
          {this.props.description}
        </Text>;
    }
    if(this.props.title){
      title=
    	<Text style={styles.titleText}>
        	{this.props.title}
        </Text>
    }
    var spacer = this.props.title ? null : <View style={{height:10}} />;

    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          {description}
          {title}
          {spacer}
        </View>
        <View>
          {this.props.children}
        </View>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor:'#C0C0C0',
  },
  titleContainer: {
	paddingLeft:10,
    backgroundColor: '#e9eaed',
  },
  descriptionText: {
	marginTop: 10,
    fontSize: 14,
  },
  titleText: {
    fontSize: 12,
    color: '#333333',
    marginTop: 10,
    marginBottom: 10,
  },
});

module.exports = PageBlock;
