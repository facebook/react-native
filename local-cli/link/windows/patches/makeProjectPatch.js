module.exports = function makeProjectPatch(projectInsert, projectName = '') {
  return {
    pattern: '<ProjectReference Include="..\\..\\node_modules\\react-native-windows\\ReactWindows\\ReactNative\\ReactNative.csproj">',
    patch: projectInsert,
    unpatch: new RegExp(`<ProjectReference.+\\s+.+\\s+.+${projectName}.+\\s+.+\\s`)
  };
};
