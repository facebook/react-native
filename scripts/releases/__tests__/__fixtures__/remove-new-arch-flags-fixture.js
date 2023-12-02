/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react-native
 */

const validReactNativePodsFile = `
def use_react_native! (
  path: "../node_modules/react-native",
  fabric_enabled: false,
  new_arch_enabled: NewArchitectureHelper.new_arch_enabled,
  production: false, # deprecated
  hermes_enabled: ENV['USE_HERMES'] && ENV['USE_HERMES'] == '0' ? false : true,
  flipper_configuration: FlipperConfiguration.disabled,
  app_path: '..',
  config_file_dir: '',
  ios_folder: 'ios'
)
end
`;

const invalidReactNativePodsFile = `
def use_react_native! (
  path: "../node_modules/react-native",
  fabric_enabled: false,
  production: false, # deprecated
  hermes_enabled: ENV['USE_HERMES'] && ENV['USE_HERMES'] == '0' ? false : true,
  flipper_configuration: FlipperConfiguration.disabled,
  app_path: '..',
  config_file_dir: '',
  ios_folder: 'ios'
)
end
`;

const expectedReactNativePodsFile = `
def use_react_native! (
  path: "../node_modules/react-native",
  production: false, # deprecated
  hermes_enabled: ENV['USE_HERMES'] && ENV['USE_HERMES'] == '0' ? false : true,
  flipper_configuration: FlipperConfiguration.disabled,
  app_path: '..',
  config_file_dir: '',
  ios_folder: 'ios'
)
end
`;

const validGradlePropertiesFile = `
# Use this property to enable support to the new architecture.
# This will allow you to use TurboModules and the Fabric render in
# your application. You should enable this flag either if you want
# to write custom TurboModules/Fabric components OR use libraries that
# are providing them.
newArchEnabled=false

# Use this property to enable or disable the Hermes JS engine.
# If set to false, you will be using JSC instead.
hermesEnabled=true
`;

const invalidGradlePropertiesFile = `
# Use this property to enable or disable the Hermes JS engine.
# If set to false, you will be using JSC instead.
hermesEnabled=true
`;

const expectedGradlePropertiesFile = `
# Use this property to enable support to the new architecture.
# This will allow you to use TurboModules and the Fabric render in
# your application. You should enable this flag either if you want
# to write custom TurboModules/Fabric components OR use libraries that
# are providing them.
newArchEnabled=true

# Use this property to enable or disable the Hermes JS engine.
# If set to false, you will be using JSC instead.
hermesEnabled=true
`;

module.exports = {
  validReactNativePodsFile,
  invalidReactNativePodsFile,
  expectedReactNativePodsFile,
  validGradlePropertiesFile,
  invalidGradlePropertiesFile,
  expectedGradlePropertiesFile,
};
