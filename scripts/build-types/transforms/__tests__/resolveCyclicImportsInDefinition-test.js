const resolveCyclicImportsInDefinition = require('../resolveCyclicImportsInDefinition.js');
const path = require('path');

const packagesPath = '/path/to/package/definition/files';

const packageConfig = [
  {directory: 'package1', name: 'package1'},
  {directory: 'package2', name: '@namespace/package2'},
];

describe('resolveCyclicImportsInDefinition', () => {
  test('should resolve type import from package', async () => {
    const code = `
    import type {Test1} from 'package1';
    import type {Test2} from '@namespace/package2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import type { Test1 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package1\\";
      import type { Test2 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package2\\";"
    `);
  });

  test('should resolve type import from deep import', async () => {
    const code = `
    import type {Test1} from 'package1/Test1';
    import type {Test2} from '@namespace/package2/Test2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import type { Test1 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package1/Test1\\";
      import type { Test2 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package2/Test2\\";"
    `);
  });

  test('should resolve named import from package', async () => {
    const code = `
    import {Test1} from 'package1';
    import {Test2} from '@namespace/package2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import { Test1 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package1\\";
      import { Test2 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package2\\";"
    `);
  });

  test('should resolve named import from deep import', async () => {
    const code = `
    import {Test1} from 'package1/Test1';
    import {Test2} from '@namespace/package2/Test2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import { Test1 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package1/Test1\\";
      import { Test2 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package2/Test2\\";"
    `);
  });

  test('should resolve default import from package', async () => {
    const code = `
    import Test1 from 'package1';
    import Test2 from '@namespace/package2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import Test1 from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package1\\";
      import Test2 from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package2\\";"
    `);
  });

  test('should resolve default import from deep import', async () => {
    const code = `
    import Test1 from 'package1/Test1';
    import Test2 from '@namespace/package2/Test2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import Test1 from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package1/Test1\\";
      import Test2 from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package2/Test2\\";"
    `);
  });

  test('should resolve import from a deeper file', async () => {
    const code = `
    import {Test1} from 'package1/Test1';
    import {Test2} from '@namespace/package2/Test2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(
        packagesPath,
        'test',
        'deep',
        'in',
        'hierarchy',
        'index.d.ts',
      ),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import { Test1 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package1/Test1\\";
      import { Test2 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package2/Test2\\";"
    `);
  });

  test('should resolve export declarations', async () => {
    const code = `
    export {Test1} from 'package1/Test1';
    export {Test2} from '@namespace/package2/Test2';
    export {default as Test3} from 'package1';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "export { Test1 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package1/Test1\\";
      export { Test2 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package2/Test2\\";
      export { default as Test3 } from \\"..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\..\\\\\\\\path\\\\\\\\to\\\\\\\\package\\\\\\\\definition\\\\\\\\files\\\\\\\\package1\\";"
    `);
  });
});
