#!/usr/bin/env node
// @ts-check

import * as assert from "node:assert/strict";
import { exec } from "node:child_process";

const { [2]: username, [3]: password, [4]: email, [5]: registry } = process.argv;
assert.ok(username, "Please specify username");
assert.ok(password, "Please specify password");
assert.ok(email, "Please specify email");

const child = exec(`npm adduser${registry ? ` --registry ${registry}` : ""}`);
assert.ok(child.stdout, "Missing stdout on child process");

child.stdout.on("data", d => {
  assert.ok(child.stdin, "Missing stdin on child process");

  process.stdout.write(d);
  process.stdout.write("\n");

  const data = d.toString();
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
