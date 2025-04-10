/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const {RNTesterThemeContext} = require('../../components/RNTesterTheme');
const React = require('react');
const {Alert, Button, StyleSheet, View} = require('react-native');

const PI: number = Math.PI;
const SOLAR_MASS: number = 4 * PI * PI;
const DAYS_PER_YEAR = 365.24;

class Body {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  mass: number;

  constructor(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    mass: number,
  ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.mass = mass;
  }
}

function Jupiter(): Body {
  return new Body(
    4.8414314424647209,
    -1.16032004402742839,
    -1.03622044471123109e-1,
    1.66007664274403694e-3 * DAYS_PER_YEAR,
    7.69901118419740425e-3 * DAYS_PER_YEAR,
    -6.90460016972063023e-5 * DAYS_PER_YEAR,
    9.54791938424326609e-4 * SOLAR_MASS,
  );
}

function Saturn(): Body {
  return new Body(
    8.34336671824457987,
    4.12479856412430479,
    -4.03523417114321381e-1,
    -2.76742510726862411e-3 * DAYS_PER_YEAR,
    4.99852801234917238e-3 * DAYS_PER_YEAR,
    2.30417297573763929e-5 * DAYS_PER_YEAR,
    2.85885980666130812e-4 * SOLAR_MASS,
  );
}

function Uranus(): Body {
  return new Body(
    1.2894369562139131e1,
    -1.51111514016986312e1,
    -2.23307578892655734e-1,
    2.96460137564761618e-3 * DAYS_PER_YEAR,
    2.3784717395948095e-3 * DAYS_PER_YEAR,
    -2.96589568540237556e-5 * DAYS_PER_YEAR,
    4.36624404335156298e-5 * SOLAR_MASS,
  );
}

function Neptune(): Body {
  return new Body(
    1.53796971148509165e1,
    -2.59193146099879641e1,
    1.79258772950371181e-1,
    2.68067772490389322e-3 * DAYS_PER_YEAR,
    1.62824170038242295e-3 * DAYS_PER_YEAR,
    -9.5159225451971587e-5 * DAYS_PER_YEAR,
    5.15138902046611451e-5 * SOLAR_MASS,
  );
}

function Sun(): Body {
  return new Body(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, SOLAR_MASS);
}

const bodies: Body[] = [Sun(), Jupiter(), Saturn(), Uranus(), Neptune()];

function offsetMomentum(): void {
  let px = 0;
  let py = 0;
  let pz = 0;
  const size: number = bodies.length;
  for (let i = 0; i < size; i++) {
    const body: Body = bodies[i];
    const mass: number = body.mass;
    px += body.vx * mass;
    py += body.vy * mass;
    pz += body.vz * mass;
  }

  const body: Body = bodies[0];
  body.vx = -px / SOLAR_MASS;
  body.vy = -py / SOLAR_MASS;
  body.vz = -pz / SOLAR_MASS;
}

function advance(dt: number) {
  const size: number = bodies.length;

  for (let i: number = 0; i < size; i++) {
    const bodyi: Body = bodies[i];
    let vxi: number = bodyi.vx;
    let vyi: number = bodyi.vy;
    let vzi: number = bodyi.vz;
    for (let j: number = i + 1; j < size; j++) {
      const bodyj: Body = bodies[j];
      const dx: number = bodyi.x - bodyj.x;
      const dy: number = bodyi.y - bodyj.y;
      const dz: number = bodyi.z - bodyj.z;

      const d2: number = dx * dx + dy * dy + dz * dz;
      const mag: number = dt / (d2 * Math.sqrt(d2));

      const massj: number = bodyj.mass;
      vxi -= dx * massj * mag;
      vyi -= dy * massj * mag;
      vzi -= dz * massj * mag;

      const massi: number = bodyi.mass;
      bodyj.vx += dx * massi * mag;
      bodyj.vy += dy * massi * mag;
      bodyj.vz += dz * massi * mag;
    }
    bodyi.vx = vxi;
    bodyi.vy = vyi;
    bodyi.vz = vzi;
  }

  for (let i: number = 0; i < size; i++) {
    const body: Body = bodies[i];
    body.x += dt * body.vx;
    body.y += dt * body.vy;
    body.z += dt * body.vz;
  }
}

function energy(): number {
  let e = 0;
  const size: number = bodies.length;

  for (let i = 0; i < size; i++) {
    const bodyi: Body = bodies[i];

    e +=
      0.5 *
      bodyi.mass *
      (bodyi.vx * bodyi.vx + bodyi.vy * bodyi.vy + bodyi.vz * bodyi.vz);

    for (let j = i + 1; j < size; j++) {
      const bodyj: Body = bodies[j];
      const dx: number = bodyi.x - bodyj.x;
      const dy: number = bodyi.y - bodyj.y;
      const dz: number = bodyi.z - bodyj.z;

      const distance: number = Math.sqrt(dx * dx + dy * dy + dz * dz);
      e -= (bodyi.mass * bodyj.mass) / distance;
    }
  }
  return e;
}

function nbody(): number {
  const n = 400_000;
  //const n = 100;

  offsetMomentum();
  for (let i = 0; i < n; i++) {
    advance(0.01);
  }

  return energy();
}

function runTest() {
  console.log(
    'hermes (mleko):',
    global.HermesInternal?.getRuntimeProperties?.()['OSS Release Version'],
  );
  const start = performance.now();
  const result = nbody();
  const end = performance.now();
  console.log(`energy: ${result}`);
  console.log(`time: ${end - start}`);
  Alert.alert(`time: ${end - start}`);
  console.log(HermesInternal.getRuntimeProperties());
}

function onButtonPress(buttonName: string) {
  runTest();
}

exports.displayName = 'ButtonExample';
exports.framework = 'React';
exports.category = 'UI';
exports.title = 'Button';
exports.documentationURL = 'https://reactnative.dev/docs/button';
exports.description = 'Simple React Native button component.';

exports.examples = [
  {
    title: 'Button with default styling',
    render: function (): React.Node {
      return (
        <Button
          onPress={() => onButtonPress('submitted')}
          testID="button_default_styling"
          title="Submit Application"
          accessibilityLabel="Press to submit your application!"
        />
      );
    },
  },
  {
    title: 'Button with color="red"',
    description:
      ('Note: On iOS, the color prop controls the color of the text. On ' +
        'Android, the color adjusts the background color of the button.': string),
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                onPress={() => onButtonPress('cancelled')}
                testID="cancel_button"
                color={theme.SystemRedColor}
                title="Cancel Application"
                accessibilityLabel="Press to cancel your application!"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Two Buttons with Flexbox layout',
    description:
      ('Two buttons wrapped inside view with justifyContent: spaceBetween,' +
        'This layout strategy lets the title define the width of the button': string),
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <View style={styles.container}>
                <Button
                  onPress={() => onButtonPress('cancelled')}
                  testID="two_cancel_button"
                  color={theme.SystemRedColor}
                  title="Cancel"
                  accessibilityLabel="Press to cancel your application!"
                />
                <Button
                  onPress={() => onButtonPress('submitted')}
                  testID="two_submit_button"
                  color={theme.SystemGreenColor}
                  title="Submit"
                  accessibilityLabel="Press to submit your application!"
                />
              </View>
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Three Buttons with Flexbox layout',
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <View style={styles.container}>
                <Button
                  onPress={() => onButtonPress('cancelled')}
                  testID="three_cancel_button"
                  color={theme.SystemRedColor}
                  title="Cancel"
                  accessibilityLabel="Press to cancel your application!"
                />
                <Button
                  onPress={() => onButtonPress('saved')}
                  testID="three_save_button"
                  color={theme.LinkColor}
                  title="Save For Later"
                  accessibilityLabel="Press to save your application!"
                />
                <Button
                  onPress={() => onButtonPress('submitted')}
                  testID="three_submit_button"
                  color={theme.SystemGreenColor}
                  title="Submit"
                  accessibilityLabel="Press to submit your application!"
                />
              </View>
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Button with disabled={true}',
    description:
      'By passing disabled={true} all interactions for the button are disabled.',
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                disabled
                onPress={() => onButtonPress('submitted')}
                color={theme.LinkColor}
                testID="disabled_button"
                title="Submit Application"
                accessibilityLabel="Press to submit your application!"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Button with accessibilityLabel="label"',
    description: ('Note: This prop changes the text that a screen ' +
      'reader announces (there are no visual differences).': string),
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                onPress={() => onButtonPress('submitted')}
                testID="accessibilityLabel_button"
                color={theme.LinkColor}
                title="Submit Application"
                accessibilityLabel="Press to submit your application!"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Button with aria-label="label"',
    description: ('Note: This prop changes the text that a screen ' +
      'reader announces (there are no visual differences).': string),
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                onPress={() => onButtonPress('submitted')}
                testID="aria_label_button"
                color={theme.LinkColor}
                title="Submit Application"
                aria-label="Press to submit your application!"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Button with accessibilityState={{disabled: true}}',
    description:
      ('Note: This prop will announce on TalkBack that the button is disabled. ' +
        'The "disabled" prop has higher precedence on the state of the component': string),
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                accessibilityState={{disabled: true}}
                onPress={() => onButtonPress('submitted')}
                testID="accessibilityState_button"
                color={theme.LinkColor}
                title="Submit Application"
                accessibilityLabel="Press to submit your application!"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
];

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
