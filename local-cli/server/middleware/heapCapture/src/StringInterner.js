// @flow

type InternedStringsTable = {
  [key: string]: number,
}

export default class StringInterner {
  strings: Array<string> = [];
  ids: InternedStringsTable = {};

  intern(s: string): number {
    const find = this.ids[s];
    if (find === undefined) {
      const id = this.strings.length;
      this.ids[s] = id;
      this.strings.push(s);
      return id;
    }

    return find;
  }

  get(id: number): string {
    return this.strings[id];
  }
}
