/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
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

var React = require('react');
var ReactNative = require('react-native');
var {
  PickerIOS,
  Text,
  View,
} = ReactNative;

var PickerComponentIOS = PickerIOS.Component;
var PickerItemIOS = PickerIOS.Item;

var CAR_MAKES_AND_MODELS = {
  amc: {
    name: 'AMC',
    models: ['AMX', 'Concord', 'Eagle', 'Gremlin', 'Matador', 'Pacer'],
  },
  alfa: {
    name: 'Alfa-Romeo',
    models: ['159', '4C', 'Alfasud', 'Brera', 'GTV6', 'Giulia', 'MiTo', 'Spider'],
  },
  aston: {
    name: 'Aston Martin',
    models: ['DB5', 'DB9', 'DBS', 'Rapide', 'Vanquish', 'Vantage'],
  },
  audi: {
    name: 'Audi',
    models: ['90', '4000', '5000', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q5', 'Q7'],
  },
  austin: {
    name: 'Austin',
    models: ['America', 'Maestro', 'Maxi', 'Mini', 'Montego', 'Princess'],
  },
  borgward: {
    name: 'Borgward',
    models: ['Hansa', 'Isabella', 'P100'],
  },
  buick: {
    name: 'Buick',
    models: ['Electra', 'LaCrosse', 'LeSabre', 'Park Avenue', 'Regal',
             'Roadmaster', 'Skylark'],
  },
  cadillac: {
    name: 'Cadillac',
    models: ['Catera', 'Cimarron', 'Eldorado', 'Fleetwood', 'Sedan de Ville'],
  },
  chevrolet: {
    name: 'Chevrolet',
    models: ['Astro', 'Aveo', 'Bel Air', 'Captiva', 'Cavalier', 'Chevelle',
             'Corvair', 'Corvette', 'Cruze', 'Nova', 'SS', 'Vega', 'Volt'],
  },
};

class PickerExample extends React.Component {
  state = {
    carMake: 'cadillac',
    modelIndex: 3,
  };

  render() {
    var make = CAR_MAKES_AND_MODELS[this.state.carMake];
    var selectionString = make.name + ' ' + make.models[this.state.modelIndex];
    return (
      <View>
        <Text>Please choose a make for your car:</Text>
        <PickerIOS
          onValueChange={(component, carMake) => this.setState({carMake, modelIndex: 0})}>
          <PickerComponentIOS selectedValue={this.state.carMake}>
            {Object.keys(CAR_MAKES_AND_MODELS).map((carMake) => (
              <PickerItemIOS
                key={carMake}
                value={carMake}
                label={CAR_MAKES_AND_MODELS[carMake].name}
              />
            ))}
          </PickerComponentIOS>
        </PickerIOS>
        <Text>Please choose a model of {make.name}:</Text>
        <PickerIOS
          selectedValue={this.state.modelIndex}
          key={this.state.carMake}
          onValueChange={(component, modelIndex) => this.setState({modelIndex})}>
            <PickerComponentIOS selectedValue={this.state.modelIndex}>
              {CAR_MAKES_AND_MODELS[this.state.carMake].models.map((modelName, modelIndex) => (
                <PickerItemIOS
                  key={this.state.carMake + '_' + modelIndex}
                  value={modelIndex}
                  label={modelName}
                />
              ))}
            </PickerComponentIOS>
        </PickerIOS>
        <Text>You selected: {selectionString}</Text>
      </View>
    );
  }
}

class PickerComponentsExample extends React.Component {
  state = {
    carMake: 'cadillac',
    modelIndex: 0,
  };

  constructor(props) {
    super(props);

    this.onValueChange = this.onValueChange.bind(this);
  }

  onValueChange(component, newValue, newIndex) {
    this.setState({
      carMake: (component === 0) ? newValue : this.state.carMake,
      modelIndex: (component === 0) ? 0 : newIndex
    });
  }

  render() {
    var make = CAR_MAKES_AND_MODELS[this.state.carMake];
    var selectionString = make.name + ' ' + make.models[this.state.modelIndex];

    return (
      <View>
        <PickerIOS onValueChange={this.onValueChange}>
          <PickerComponentIOS selectedValue={this.state.carMake}>
            {Object.keys(CAR_MAKES_AND_MODELS).map((carMake) => (
              <PickerItemIOS
                key={carMake}
                value={carMake}
                label={CAR_MAKES_AND_MODELS[carMake].name}
              />
            ))}
          </PickerComponentIOS>
          <PickerComponentIOS selectedValue={this.state.modelIndex}>
            {CAR_MAKES_AND_MODELS[this.state.carMake].models.map((modelName, modelIndex) => (
              <PickerItemIOS
                key={this.state.carMake + '_' + modelIndex}
                value={modelIndex}
                label={modelName}
              />
            ))}
          </PickerComponentIOS>
        </PickerIOS>
        <Text>You selected: {selectionString}</Text>
      </View>
    );
  }
}

class PickerStyleExample extends React.Component {
  state = {
    carMake: 'cadillac',
    modelIndex: 0,
  };

  render() {
    return (
      <PickerIOS
        itemStyle={{fontSize: 25, color: 'red', textAlign: 'left', fontWeight: 'bold'}}
        onValueChange={(component, carMake) => this.setState({carMake, modelIndex: 0})}>
          <PickerComponentIOS selectedValue={this.state.carMake}>
            {Object.keys(CAR_MAKES_AND_MODELS).map((carMake) => (
              <PickerItemIOS
                key={carMake}
                value={carMake}
                label={CAR_MAKES_AND_MODELS[carMake].name}
              />
            ))}
          </PickerComponentIOS>
      </PickerIOS>
    );
  }
}

exports.displayName = (undefined: ?string);
exports.title = '<PickerIOS>';
exports.description = 'Render lists of selectable options with UIPickerView.';
exports.examples = [
{
  title: '<PickerIOS>',
  render: function(): React.Element<any> {
    return <PickerExample />;
  },
},
{
  title: '<PickerIOS> with multiple components',
  render: function(): React.Element<any> {
    return <PickerComponentsExample />;
  },
},
{
  title: '<PickerIOS> with custom styling',
  render: function(): React.Element<any> {
    return <PickerStyleExample />;
  },
}];
