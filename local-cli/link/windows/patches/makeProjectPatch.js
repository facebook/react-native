module.exports = function makeProjectPatch(windowsConfig) {

  const projectInsert = `<ProjectReference Include="..\\${windowsConfig.relativeProjPath}">
      <Project>{${windowsConfig.pathGUID}}</Project>
      <Name>${windowsConfig.projectName}</Name>
    </ProjectReference>
    `;

  return {
    pattern: '<ProjectReference Include="..\\..\\node_modules\\react-native-windows\\ReactWindows\\ReactNative\\ReactNative.csproj">',
    patch: projectInsert,
    unpatch: new RegExp(`<ProjectReference.+\\s+.+\\s+.+${windowsConfig.projectName}.+\\s+.+\\s`),
  };
};
