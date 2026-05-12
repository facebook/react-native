export type Greeting = Readonly<{
  name: string;
  language: string;
}>;

export function formatGreeting(g: Greeting): string;
export function getVersion(): Promise<string>;
