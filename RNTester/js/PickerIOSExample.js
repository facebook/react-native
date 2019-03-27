/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {PickerIOS, Text, View} = ReactNative;

const PickerItemIOS = PickerIOS.Item;

const CAR_MAKES_AND_MODELS = {
  amc: {
    name: 'AMC',
    models: ['AMX', 'Concord', 'Eagle', 'Gremlin', 'Matador', 'Pacer'],
  },
  alfa: {
    name: 'Alfa-Romeo',
    models: [
      '159',
      '4C',
      'Alfasud',
      'Brera',
      'GTV6',
      'Giulia',
      'MiTo',
      'Spider',
    ],
  },
  aston: {
    name: 'Aston Martin',
    models: ['DB5', 'DB9', 'DBS', 'Rapide', 'Vanquish', 'Vantage'],
  },
  audi: {
    name: 'Audi',
    models: [
      '90',
      '4000',
      '5000',
      'A3',
      'A4',
      'A5',
      'A6',
      'A7',
      'A8',
      'Q5',
      'Q7',
    ],
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
    models: [
      'Electra',
      'LaCrosse',
      'LeSabre',
      'Park Avenue',
      'Regal',
      'Roadmaster',
      'Skylark',
    ],
  },
  cadillac: {
    name: 'Cadillac',
    models: ['Catera', 'Cimarron', 'Eldorado', 'Fleetwood', 'Sedan de Ville'],
  },
  chevrolet: {
    name: 'Chevrolet',
    models: [
      'Astro',
      'Aveo',
      'Bel Air',
      'Captiva',
      'Cavalier',
      'Chevelle',
      'Corvair',
      'Corvette',
      'Cruze',
      'Nova',
      'SS',
      'Vega',
      'Volt',
    ],
  },
};

class PickerExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    carMake: 'cadillac',
    modelIndex: 3,
  };

  render() {
    const make = CAR_MAKES_AND_MODELS[this.state.carMake];
    const selectionString =
      make.name + ' ' + make.models[this.state.modelIndex];
    return (
      <View>
        <Text>Please choose a make for your car:</Text>
        <PickerIOS
          selectedValue={this.state.carMake}
          onValueChange={carMake => this.setState({carMake, modelIndex: 0})}>
          {Object.keys(CAR_MAKES_AND_MODELS).map(carMake => (
            <PickerItemIOS
              key={carMake}
              value={carMake}
              label={CAR_MAKES_AND_MODELS[carMake].name}
            />
          ))}
        </PickerIOS>
        <Text>Please choose a model of {make.name}:</Text>
        <PickerIOS
          selectedValue={this.state.modelIndex}
          key={this.state.carMake}
          onValueChange={modelIndex => this.setState({modelIndex})}>
          {CAR_MAKES_AND_MODELS[this.state.carMake].models.map(
            (modelName, modelIndex) => (
              <PickerItemIOS
                key={this.state.carMake + '_' + modelIndex}
                value={modelIndex}
                label={modelName}
              />
            ),
          )}
        </PickerIOS>
        <Text>You selected: {selectionString}</Text>
      </View>
    );
  }
}

class PickerStyleExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    carMake: 'cadillac',
    modelIndex: 0,
  };

  render() {
    return (
      <PickerIOS
        itemStyle={{
          fontSize: 25,
          color: 'red',
          textAlign: 'left',
          fontWeight: 'bold',
        }}
        selectedValue={this.state.carMake}
        onValueChange={carMake => this.setState({carMake, modelIndex: 0})}>
        {Object.keys(CAR_MAKES_AND_MODELS).map(carMake => (
          <PickerItemIOS
            key={carMake}
            value={carMake}
            label={CAR_MAKES_AND_MODELS[carMake].name}
          />
        ))}
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
    title: '<PickerIOS> with custom styling',
    render: function(): React.Element<any> {
      return <PickerStyleExample />;
    },
  },
];
