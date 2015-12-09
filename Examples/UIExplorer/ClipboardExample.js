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
   Clipboard,
   View,
   Text,
 } = React;



 var ClipboardExample = React.createClass({
   getInitialState: function() {
     return {
       content:'This is content in Clipboard'
     };
   },
   _setContentToClipboard:function(){
     Clipboard.setString('Hello World');
     Clipboard.getString((content)=>{
       this.setState({content});
     });
   },
   render() {
     return (
       <View>
         <Text onPress={this._setContentToClipboard} style={{color:'blue'}}>Click me to set "Hello World" to Clipboard</Text>
         <Text style={{color:'red',marginTop:20}}>{this.state.content}</Text>
       </View>
     );
   }
 });



exports.title = 'Clipboard';
exports.description = 'Show Clipboard content.';


exports.examples = [
  {
    title: 'click button and setString("Hello World") and getString',
    render(): ReactElement { return <ClipboardExample />; }
  }
];
