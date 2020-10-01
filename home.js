import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Screen1, Screen2} from '../pages';

const Stack = createStackNavigator();

const Router = () => {
  return (
    <Stack.Navigator initialRouteName="Screen1">
      <Stack.Screen
        name="Screen1"
        component={Screen1}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Screen2"
        component={Screen2}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default Router;
