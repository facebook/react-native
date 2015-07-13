/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  Image,
  StyleSheet,
  Text,
  View,
  ScrollView
} = React;

var AssetThumbnailExampleView = React.createClass({

  getInitialState() {
    return {
      asset: this.props.asset
    };
  },

  render() {
    var asset = this.state.asset;
    return (
      <ScrollView>
        <View style={ styles.row }>
          <Image
            source={{ uri: asset.node.image.uri  }}
            style={ styles.image1 }
          />
        </View>

        <View style={ styles.row }>
          <Image
            source={{ uri: asset.node.image.uri }}
            style={ styles.image2 }
          />
        </View> 

        <View style={ styles.row }>
          <Image
            source={{ uri: asset.node.image.uri }}
            style={ styles.image3 }
          />
        </View>

     
        
      </ScrollView>
    );
  },
  

});

var styles = StyleSheet.create({
  row: {
    padding: 10,
    flex: 1,
    flexDirection: 'row',
  },
  
  details: {
    margin: 5
  },
  
  textColumn: {
    flex: 1,
    flexDirection: 'column'
  },
  
  image1: {
    borderWidth: 1,
    borderColor: 'black',
    width: 240,
    height: 320,
    margin: 5, 
  },

  image2: {
    borderWidth: 1,
    borderColor: 'black',
    width: 320,
    height: 240
  },

  image3: {
    borderWidth: 1,
    borderColor: 'black',
    width: 100,
    height: 100
  },

  image4: {
    borderWidth: 1,
    borderColor: 'black',
    width: 200,
    height: 200
  },

  image5: {
    borderWidth: 1,
    borderColor: 'black',
    width: 355,
    height: 100
  },

  image6: {
    borderWidth: 1,
    borderColor: 'black',
    width: 355,
    height: 355
  },
  
});

exports.title = '<AssetThumbnailExample>';
exports.description = 'Example component that displays the thumbnail capabilities of the <Image /> tag';
module.exports = AssetThumbnailExampleView;