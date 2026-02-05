## Danger

[Danger](http://danger.systems/js/) is a JavaScript runtime which helps you provide continuous feedback inside GitHub.
It's used inside Github Actions to analyze the contents of a GitHub pull request.

If you want to test changes to Danger, I'd recommend checking out an existing PR and then running the `danger pr` command.
You'll need a GitHub Public Access Token (PAT). It will look like `github_pat_<REDACTED>`.

So, for example:

```
cd private/react-native-bots && yarn
DANGER_GITHUB_API_TOKEN=ghp_<REDACTED> yarn danger pr https://github.com/facebook/react-native/pull/1234
```
