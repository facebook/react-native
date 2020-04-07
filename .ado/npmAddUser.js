#!/usr/bin/env node
// @ts-check

const child_process = require("child_process");

const username = process.argv[2];
const password = process.argv[3];
const email = process.argv[4];
const registry = process.argv[5];

if (!username) {
  console.error("Please specify username");
  process.exit(1);
}

if (!password) {
  console.error("Please specify password");
  process.exit(1);
}

if (!email) {
  console.error("Please specify email");
  process.exit(1);
}

const child = child_process.exec(`npm adduser${registry? (' --registry ' + registry) :''}` );

child.stdout.on("data", d => {
  const data = d.toString();
  process.stdout.write(d + "\n");
  if (data.match(/username/i)) {
    child.stdin.write(username + "\n");
  } else if (data.match(/password/i)) {
    child.stdin.write(password + "\n");
  } else if (data.match(/email/i)) {
    child.stdin.write(email + "\n");
  } else if (data.match(/logged in as/i)) {
    child.stdin.end();
  }
});
