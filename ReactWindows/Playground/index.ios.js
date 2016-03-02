'use strict';
import React, {
    AppRegistry,
    Component,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    LayoutAnimation,
} from 'react-native';

var CustomLayoutAnimation = {
    duration: 200,
    create: {
        type: LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
    },
    update: {
        type: LayoutAnimation.Types.easeInEaseOut,
    },
};

class AnimationExample extends Component {

    constructor() {
        super();

        this.state = {
            index: 0,
        }
    }

    onPress(index) {

        // Uncomment to animate the next state change.
        //LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

        // Or use a Custom Layout Animation
        LayoutAnimation.configureNext(CustomLayoutAnimation);

        this.setState({index: index});
    }

    renderButton(index) {
        return (
          <TouchableOpacity key={'button' + index} style={styles.button} onPress={() => this.onPress(index)}>
            <Text>{index}</Text>
          </TouchableOpacity>
        );
            }

    renderCircle(key) {
        var size = 50;
        return (
          <View key={key} style={{width: size, height: size, borderRadius: size / 2.0, backgroundColor: 'sandybrown', margin: 20}}/>
        );
}

render() {

    var leftStyle = this.state.index === 0 ? {flex: 1} : {width: 20};
    var middleStyle = this.state.index === 2 ? {width: 20} : {flex: 1};
    var rightStyle = {flex: 1};

    var whiteHeight = this.state.index * 80;

    var circles = [];
    for (var i = 0; i < (5 + this.state.index); i++) {
        circles.push(this.renderCircle(i));
    }

    return (
      <View style={styles.container}>
        <View style={styles.topButtons}>
          {this.renderButton(0)}
{this.renderButton(1)}
{this.renderButton(2)}
</View>
<View style={styles.content}>
  <View style={{flexDirection: 'row', height: 100}}>
            <View style={[leftStyle, {backgroundColor: 'firebrick'}]}/>
            <View style={[middleStyle, {backgroundColor: 'seagreen'}]}/>
            <View style={[rightStyle, {backgroundColor: 'steelblue'}]}/>
          </View>
          <View style={{height: whiteHeight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden'}}>
            <View>
              <Text>Stuff Goes Here</Text>
            </View>
          </View>
          <View style={styles.circleContainer}>
            {circles}
          </View>
        </View>
      </View>
    );
}
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    topButtons: {
        marginTop: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        backgroundColor: 'lightblue',
    },
    button: {
        flex: 1,
        height: 60,
        alignSelf: 'stretch',
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 8,
    },
    content: {
        flex: 1,
        alignSelf: 'stretch',
    },
    circleContainer: {
        flexDirection: 'row',
        flex: 1,
        flexWrap: 'wrap',
        padding: 30,
        justifyContent: 'center',
        alignItems: 'center'
    },
});

AppRegistry.registerComponent('ReactRoot', () => AnimationExample);

