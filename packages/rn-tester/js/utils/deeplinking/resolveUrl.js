import RNTesterList from '../RNTesterList';

// Supported URL pattern(s):
// *  rntester://example/<moduleKey>
// *  rntester://example/<moduleKey>/<exampleKey>
export const resolveUrl = (url: string) => {
  const match =
    /^rntester:\/\/example\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?$/.exec(
      url,
    );
  if (!match) {
    console.warn(
      `handleOpenUrlRequest: Received unsupported URL: '${url}'`,
    );
    return;
  }

  const rawModuleKey = match[1];
  const exampleKey = match[2];

  // For tooling compatibility, allow all these variants for each module key:
  const validModuleKeys = [
    rawModuleKey,
    `${rawModuleKey}Index`,
    `${rawModuleKey}Example`,
  ].filter(k => RNTesterList.Modules[k] != null);
  if (validModuleKeys.length !== 1) {
    if (validModuleKeys.length === 0) {
      console.error(
        `handleOpenUrlRequest: Unable to find requested module with key: '${rawModuleKey}'`,
      );
    } else {
      console.error(
        `handleOpenUrlRequest: Found multiple matching module with key: '${rawModuleKey}', unable to resolve`,
      );
    }
    return;
  }

  const resolvedModuleKey = validModuleKeys[0];
  const exampleModule = RNTesterList.Modules[resolvedModuleKey];

  if (exampleKey != null) {
    const validExampleKeys = exampleModule.examples.filter(
      e => e.name === exampleKey,
    );
    if (validExampleKeys.length !== 1) {
      if (validExampleKeys.length === 0) {
        console.error(
          `handleOpenUrlRequest: Unable to find requested example with key: '${exampleKey}' within module: '${resolvedModuleKey}'`,
        );
      } else {
        console.error(
          `handleOpenUrlRequest: Found multiple matching example with key: '${exampleKey}' within module: '${resolvedModuleKey}', unable to resolve`,
        );
      }
      return;
    }
  }

  return {
    moduleKey: resolvedModuleKey,
    exampleModule,
    exampleKey,
  };
};
