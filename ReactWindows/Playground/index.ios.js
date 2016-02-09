'use strict';

const React = require('react-native');
const styles={
   views:{
       flexDirection: 'column'
   },
   images: {
       height:200,
       width:250,
       borderWidth: 5, 
       borderColor: '#f099f0',
       borderRadius: 10
   },
   textInput: {
       height: 40,
       borderWidth: 5, 
       borderColor: '#015d87'
   },
   longTextInput: {
       height: 80,
       borderWidth: 3,
       borderColor: '#ccc'
   }
};

var {AppRegistry, View, Text, TextInput, Image, Switch } = React;

    var ReactRoot = React.createClass({
		
	getInitialState: function(){
		var text = "You can see me!";
        var longText = "This is such a long text that it needs to go into a new lineThis is such a long text that it needs to go into a new lineThis is such a long text that it needs to go into a new lineThis is such a long text that it needs to go into a new lineThis is such a long text that it needs to go into a new line";
        
        return {
            value: text,
            longText: longText,
            isToggled: false,
            w: 100,
            h: 150
        };
	},

	onToggle: function(value) {
	    this.setState({isToggled: value});
	    if (value) {
	        this.setState({w: 150, h: 100});
	    }
	    else {
	        this.setState({w: 100, h: 150});
	    }
	},

    render: function() {
        let imageURL = "http://facebook.github.io/react-native/img/opengraph.png?2";
        
        return (
            <View>
              <View style={styles.views}>
		         <Text>Hello World!</Text>
				{(this.state && this.state.value) 
			     ? <TextInput value={this.state.value} style={styles.textInput}></TextInput> 
				 : undefined}
                
                {(this.state && this.state.longText) 
			     ? <TextInput value={this.state.longText} multiline={true} style={styles.longTextInput}></TextInput> 
				 : undefined}
              </View>
              <View style={styles.views}>
                 <Image source={{uri: 'http://facebook.github.io/origami/public/images/blog-hero.jpg?r=1'}} style={styles.images}/>
              </View>
              <View style={{width: this.state.w, height: this.state.h, backgroundColor: 'red'}} />
              <Switch onValueChange={this.onToggle} value={this.state.isToggled} />
            </View>
        );
    }
 });

AppRegistry.registerComponent('ReactRoot', () => ReactRoot);
