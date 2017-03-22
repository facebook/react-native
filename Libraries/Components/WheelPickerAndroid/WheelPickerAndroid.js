import {WheelPicker, DatePicker, TimePicker} from 'react-native-wheel-picker-android'
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

class WheelPickerAndroid extends Component {
  render() {
    let now = new Date()
    let wheelPickerData = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return (
      <View style={styles.container}>
        <WheelPicker
           onItemSelected={(event)=>this.onItemSelected(event)}
           isCurved
           data={wheelPickerData}
           style={styles.wheelPicker}/>
         <DatePicker
           initDate={now.toISOString()}
           onDateSelected={(date)=>this.onDateSelected(date)}/>
         <TimePicker
           initDate={now.toISOString()}
           onTimeSelected={(date)=>this.onTimeSelected(date)}/>
      </View>
    );
  }

  onItemSelected(event){
    // do something
  }

  onDateSelected(date){
    // do something
  }

  onTimeSelected(date){
    // do something
  }


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  wheelPicker: {
    width:200,
    height: 150
  }
});

module.exports = WheelPickerAndroid;
