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
 */
'use strict';

var React = require('react-native');
var {
  Animated,
  StyleSheet,
  Text,
  View,
} = React;

var styles = StyleSheet.create({
  container: {
    height: 500,
  },
  box1: {
    left: 0,
    backgroundColor: 'green',
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [
      {translateX: 100},
      {translateY: 50},
      {rotate: '30deg'},
      {scaleX: 2},
      {scaleY: 2},
    ],
    width: 50,
  },
  box2: {
    left: 0,
    backgroundColor: 'purple',
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [
      {scaleX: 2},
      {scaleY: 2},
      {translateX: 100},
      {translateY: 50},
      {rotate: '30deg'},
    ],
    width: 50,
  },
  box3step1: {
    left: 0,
    backgroundColor: '#ffb6c1', // lightpink
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [
      {rotate: '30deg'},
    ],
    width: 50,
  },
  box3step2: {
    left: 0,
    backgroundColor: '#ff69b4', //hotpink
    height: 50,
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    transform: [
      {rotate: '30deg'},
      {scaleX: 2},
      {scaleY: 2},
    ],
    width: 50,
  },
  box3step3: {
    left: 0,
    backgroundColor: '#ff1493', // deeppink
    height: 50,
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    transform: [
      {rotate: '30deg'},
      {scaleX: 2},
      {scaleY: 2},
      {translateX: 100},
      {translateY: 50},
    ],
    width: 50,
  },
  box4: {
    left: 0,
    backgroundColor: '#ff8c00', // darkorange
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [
      {translate: [200, 350]},
      {scale: 2.5},
      {rotate: '-0.2rad'},
    ],
    width: 100,
  },
  box5: {
    backgroundColor: '#800000', // maroon
    height: 50,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 50,
  },
  box5Transform: {
    transform: [
      {translate: [-50, 35]},
      {rotate: '50deg'},
      {scale: 2},
    ],
  },
  flipCardContainer: {
    height: 300,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipCard: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
    backfaceVisibility: 'hidden',
  },
  flipText: {
    color: '#fff',
  }
});

var Flip = React.createClass({
  getInitialState() {
    return {
      theta: new Animated.Value(45),
    };
  },

  componentDidMount() {
    this._animate();
  },

  _animate() {
    this.state.theta.setValue(0);
    Animated.timing(this.state.theta, {
      toValue: 180,
      duration: 500,
    }).start((finished) => {
      if(finished) return this._animate();
    });
  },

  render() {
    return (
      <View style={styles.flipCardContainer}>
        <Animated.View style={[
          styles.flipCard,
          {
            transform: [
              { perspective: 850 },
              {
                rotateX: this.state.theta.interpolate({
                  inputRange: [0, 180],
                  outputRange: ['0deg', '180deg']
                })
              },
            ]
          }
        ]}>
          <Text style={styles.flipText}>1</Text>
        </Animated.View>
      </View>
    );
  }
});

exports.title = 'Transforms';
exports.description = 'View transforms';
exports.examples = [
  {
    title: 'Perspective',
    description: "perspective: 850, rotateY: 180",
    render(): ReactElement { return <Flip />; }
  },
  {
    title: 'Translate, Rotate, Scale',
    description: "translateX: 100, translateY: 50, rotate: '30deg', scaleX: 2, scaleY: 2",
    render() {
      return (
        <View style={styles.container}>
          <View style={styles.box1} />
        </View>
      );
    }
  },
  {
    title: 'Scale, Translate, Rotate, ',
    description: "scaleX: 2, scaleY: 2, translateX: 100, translateY: 50, rotate: '30deg'",
    render() {
      return (
        <View style={styles.container}>
          <View style={styles.box2} />
        </View>
      );
    }
  },
  {
    title: 'Rotate',
    description: "rotate: '30deg'",
    render() {
      return (
        <View style={styles.container}>
          <View style={styles.box3step1} />
        </View>
      );
    }
  },
  {
    title: 'Rotate, Scale',
    description: "rotate: '30deg', scaleX: 2, scaleY: 2",
    render() {
      return (
        <View style={styles.container}>
          <View style={styles.box3step2} />
        </View>
      );
    }
  },
  {
    title: 'Rotate, Scale, Translate ',
    description: "rotate: '30deg', scaleX: 2, scaleY: 2, translateX: 100, translateY: 50",
    render() {
      return (
        <View style={styles.container}>
          <View style={styles.box3step3} />
        </View>
      );
    }
  },
  {
    title: 'Translate, Scale, Rotate',
    description: "translate: [200, 350], scale: 2.5, rotate: '-0.2rad'",
    render() {
      return (
        <View style={styles.container}>
          <View style={styles.box4} />
        </View>
      );
    }
  },
  {
    title: 'Translate, Rotate, Scale',
    description: "translate: [-50, 35], rotate: '50deg', scale: 2",
    render() {
      return (
        <View style={styles.container}>
          <View style={[styles.box5, styles.box5Transform]} />
        </View>
      );
    }
  }
];
