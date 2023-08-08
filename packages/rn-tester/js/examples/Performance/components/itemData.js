/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

const ALL_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateRandomString(length: number = 16): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += ALL_CHARS.charAt(Math.floor(Math.random() * ALL_CHARS.length));
  }
  return str;
}

function generateRandomAge(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomName(): string {
  return 'Joe ' + generateRandomString();
}

function generateRandomAddress(): string {
  const city = generateRandomName() + ' City';
  const state = generateRandomName() + ' State';
  const country = generateRandomName() + ' Country';
  return `${city}, ${state}, ${country}`;
}

export interface ItemDataType {
  id: string;
  name: string;
  address: string;
  age: number;
}

export function generateRandomItems(count: number): ItemDataType[] {
  return Array.from(Array(count), () => ({
    id: generateRandomString(),
    name: generateRandomName(),
    address: generateRandomAddress(),
    age: generateRandomAge(13, 40),
  }));
}

export const LIST_10_ITEMS: ItemDataType[] = generateRandomItems(10);
export const LIST_100_ITEMS: ItemDataType[] = generateRandomItems(100);
export const LIST_1000_ITEMS: ItemDataType[] = generateRandomItems(1000);
