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
 * @providesModule NavigationHeaderBackButton
 * @flow
*/
'use strict';

const React = require('react-native');
const NavigationContainer = require('NavigationContainer');
const NavigationRootContainer = require('NavigationRootContainer');

const {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
} = React;

type Props = {
  onNavigate: Function
}

const NavigationHeaderBackButton = (props: Props) => (
  <TouchableOpacity style={styles.buttonContainer} onPress={() => props.onNavigate(NavigationRootContainer.getBackAction())}>
    <Image style={styles.button} source={require('./assets/back-icon.png')} />
  </TouchableOpacity>
);

NavigationHeaderBackButton.propTypes = {
  onNavigate: React.PropTypes.func.isRequired
};

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    height: 24,
    width: 24,
    margin: Platform.OS === 'ios' ? 10 : 16,
    resizeMode: 'contain'
  }
});

module.exports = NavigationContainer.create(NavigationHeaderBackButton);
