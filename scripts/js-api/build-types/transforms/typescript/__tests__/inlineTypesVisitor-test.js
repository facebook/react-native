/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const babel = require('@babel/core');

const postTransforms = [require('../simplifyTypes/inlineTypesVisitor')];

async function applyPostTransforms(inSrc: string): Promise<string> {
  const result = await babel.transformAsync(inSrc, {
    plugins: ['@babel/plugin-syntax-typescript', ...postTransforms],
  });

  return result.code;
}

describe('inlineTypesVisitor', () => {
  test('should inline type non-generic type aliases', async () => {
    const code = `
      type AnimatedNodeConfig = {
        readonly debugID?: string | undefined;
      };

      export type Example = Omit<
        AnimatedNodeConfig,
        keyof {
          useNativeDriver: boolean;
        }
      > & {
        useNativeDriver: boolean;
      };
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type AnimatedNodeConfig = {
        readonly debugID?: string | undefined;
      };
      export type Example = {
        readonly debugID?: string | undefined;
        useNativeDriver: boolean;
      };"
    `);
  });

  test('should skip recursive definitions', async () => {
    const code = `
      export type LinkedNode = {
        value: number;
        next: LinkedNode;
      };
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "export type LinkedNode = {
        value: number;
        next: LinkedNode;
      };"
    `);
  });

  test('should skip co-recursive definitions', async () => {
    const code = `
      type Expr = Add | Multiply | number;

      export type Add = {
        type: 'add';
        lhs: Expr;
        rhs: Expr;
      };

      export type Multiply = {
        type: 'multiply';
        lhs: Expr;
        rhs: Expr;
      };
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Expr = Add | Multiply | number;
      export type Add = {
        type: 'add';
        lhs: Add | Multiply | number;
        rhs: Expr;
      };
      export type Multiply = {
        type: 'multiply';
        lhs: Expr;
        rhs: Expr;
      };"
    `);
  });

  test('keyof {} is never', async () => {
    const code = `
      export type NeverInDisguise = keyof {};
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(
      `"export type NeverInDisguise = never;"`,
    );
  });

  test('keyof for objects with computed string properties', async () => {
    const code = `
      export type Foo = keyof { 'a-key': number, 'b-key': number };
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(
      `"export type Foo = \\"a-key\\" | \\"b-key\\";"`,
    );
  });

  test('resolves Readonly type', async () => {
    const code = `
      export type Foo = Readonly<{ a?: number, 'b-key': number }>;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "export type Foo = {
        readonly a?: number;
        readonly 'b-key': number;
      };"
    `);
  });

  test('resolves Partial type', async () => {
    const code = `
      export type Foo = Partial<{ a: number, 'b-key': number }>;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "export type Foo = {
        a?: number;
        'b-key'?: number;
      };"
    `);
  });

  test('resolves simple intersection', async () => {
    const code = `
      export type Foo = { a?: number, 'b-key': number } & { c: number, 'd-key'?: number };
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "export type Foo = {
        a?: number;
        \\"b-key\\": number;
        c: number;
        \\"d-key\\"?: number;
      };"
    `);
  });

  test('can inline multiple references to a single type in a declaration', async () => {
    const code = `
      export declare type Result =
        & Omit<{ alpha: 1; }, keyof Beta>
        & Omit<Beta, "gamma">
      ;

      declare type Beta = Readonly<{
        beta: 2;
      }>;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "export declare type Result = {
        alpha: 1;
        readonly beta: 2;
      };
      declare type Beta = {
        readonly beta: 2;
      };"
    `);
  });

  test('should preserve dec comments when inlining types', async () => {
    const code = `
      declare type A = {
        /**
         * Comment for prop1 in A
         */
        prop1: string;
        /**
         * Comment for prop2 in A
         */
        prop2: number;
      };

      declare type B = {
        /**
         * Comment for prop1 in B
         */
        prop1: string[];
        /**
         * Comment for prop3 in B
         */
        prop3: boolean;
      };

      declare type C = {
        /**
         * Comment for prop4 in D
         */
        prop4: number;
      };

      export declare type D = Omit<Omit<A, keyof B> & B, keyof C> & C;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "declare type A = {
        /**
         * Comment for prop1 in A
         */
        prop1: string;
        /**
         * Comment for prop2 in A
         */
        prop2: number;
      };
      declare type B = {
        /**
         * Comment for prop1 in B
         */
        prop1: string[];
        /**
         * Comment for prop3 in B
         */
        prop3: boolean;
      };
      declare type C = {
        /**
         * Comment for prop4 in D
         */
        prop4: number;
      };
      export declare type D = {
        /**
         * Comment for prop2 in A
         */
        prop2: number;
        /**
         * Comment for prop1 in B
         */
        prop1: string[];
        /**
         * Comment for prop3 in B
         */
        prop3: boolean;
        /**
         * Comment for prop4 in D
         */
        prop4: number;
      };"
    `);
  });

  test('should inline generic type aliases', async () => {
    const code = `
      type Required<T, U = string> = {
        data: T[];
      } & {
        title: U;
      }

      type Optional<T> = {
        header: T;
      }

      export type Example<DataT> = Omit<
        Required<DataT>,
        keyof Optional<DataT>
      > & Optional<DataT>;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Required<T, U = string> = {
        data: T[];
        title: U;
      };
      type Optional<T> = {
        header: T;
      };
      export type Example<DataT> = {
        data: DataT[];
        title: string;
        header: DataT;
      };"
    `);
  });

  test('should inline generic type equal to one of its type parameters', async () => {
    const code = `
      type PropsAlias<Props extends {}> = Props;
      export type Example = PropsAlias<{a: string}>;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type PropsAlias<Props extends {}> = Props;
      export type Example = {
        a: string;
      };"
    `);
  });

  test('should not confuse local symbols with global ones', async () => {
    const code = `
      type PropsAlias<Props extends {}> = Props;

      type Props = {
        b: number;
      };

      export type Example = PropsAlias<{a: string}>;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type PropsAlias<Props extends {}> = Props;
      type Props = {
        b: number;
      };
      export type Example = {
        a: string;
      };"
    `);
  });

  test('should inline types inside Omit when used in union', async () => {
    const code = `
      declare type ProgressBarAndroidBaseProps = {
        readonly animating?: boolean | undefined;
        readonly color?: ColorValue | undefined;
        readonly testID?: string | undefined;
      };

      declare type DeterminateProgressBarAndroidStyleAttrProp = {
        styleAttr: "Horizontal";
        indeterminate: false;
        progress: number;
      };

      declare type IndeterminateProgressBarAndroidStyleAttrProp = {
        styleAttr: "Normal"
        indeterminate: true;
      };

      export declare type ProgressBarAndroidProps =
        | Readonly<
            Omit<
              ProgressBarAndroidBaseProps,
              "styleAttr" | "indeterminate" | "progress"
            > &
            Omit<DeterminateProgressBarAndroidStyleAttrProp, never> & {}
          >
        | Readonly<
            Omit<
              ProgressBarAndroidBaseProps,
              "styleAttr" | "indeterminate"
            > &
            Omit<IndeterminateProgressBarAndroidStyleAttrProp, never> & {}
          >;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "declare type ProgressBarAndroidBaseProps = {
        readonly animating?: boolean | undefined;
        readonly color?: ColorValue | undefined;
        readonly testID?: string | undefined;
      };
      declare type DeterminateProgressBarAndroidStyleAttrProp = {
        styleAttr: \\"Horizontal\\";
        indeterminate: false;
        progress: number;
      };
      declare type IndeterminateProgressBarAndroidStyleAttrProp = {
        styleAttr: \\"Normal\\";
        indeterminate: true;
      };
      export declare type ProgressBarAndroidProps = {
        readonly animating?: boolean | undefined;
        readonly color?: ColorValue | undefined;
        readonly testID?: string | undefined;
        readonly styleAttr: \\"Horizontal\\";
        readonly indeterminate: false;
        readonly progress: number;
      } | {
        readonly animating?: boolean | undefined;
        readonly color?: ColorValue | undefined;
        readonly testID?: string | undefined;
        readonly styleAttr: \\"Normal\\";
        readonly indeterminate: true;
      };"
    `);
  });
});
