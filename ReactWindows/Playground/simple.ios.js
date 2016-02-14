'use strict';
import React, {
    AppRegistry,
    Component,
    StyleSheet,
    Text,
    View,
    Switch
} from 'react-native';

class TestExample extends Component {

    constructor() {
        super();

        this.state = {
            isToggled: false,
        }
    }

    onToggled(value) {
        this.setState({isToggled: value});
    }

    renderText() {
        if (!this.state.isToggled)
            return null;

        return (
            <Text>Hello World!</Text>
        );
    }

    render() {

        return (
          <View style={styles.container}>
            <Switch
              value={this.state.isToggled}
              onValueChange={this.onToggled} />
            {this.renderText()}
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

AppRegistry.registerComponent('ReactRoot', () => TestExample);

