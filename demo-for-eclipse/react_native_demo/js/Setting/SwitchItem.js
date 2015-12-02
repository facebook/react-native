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
 * @providesModule SwitchItem
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
} = React;

var SwitchItem = React.createClass({
	propTypes: {
	    title: React.PropTypes.string,
	    description: React.PropTypes.string,
	},
	  
	render:function(){
		return(
			<TouchableHighlight>	
			<View style={styles.container}>
		        <View>
		          <Text style={styles.titleText}>
		            {this.props.title}
		          </Text>
		        </View>
		        <View style={styles.children}>
		          {this.props.children}
		        </View>
	      </View>
	      </TouchableHighlight>
		);
	}
});

var styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderColor:'#E6E6E6',
  },
  text: {
    color: '#333333',
  },
  children: {
	position: 'absolute',
    right: 10,
    flexDirection:'row',
    alignItems: 'center', 
    justifyContent: 'center',
  }
});

module.exports = SwitchItem;