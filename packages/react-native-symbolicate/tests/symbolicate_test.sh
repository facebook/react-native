#!/bin/bash

SYMBOLICATE_CMD="$1"
cd "$( dirname "${BASH_SOURCE[0]}" )" || exit 1

exitcode=0
trap 'exit $exitcode' EXIT

can() {
  /usr/bin/diff >&2 -U5 "${@:2}" || {
    exitcode=$?
    printf >&2 "FAIL: can't %s\\n" "$1"
  }
}

symbolicate() {
  $SYMBOLICATE_CMD "$@"
}


can "symbolicate a stack trace" \
  <(symbolicate testfile.js.map < testfile.stack) \
  testfile.symbolicated.stack

can "symbolicate a single entry" \
  <(symbolicate testfile.js.map 1 161) \
  <(echo thrower.js:18:null)

can "symbolicate a sectioned file" \
  <(symbolicate sectioned-testfile.js.map 1 72) \
  <(echo nested-thrower.js:6:start)

can "symbolicate a profiler map" \
  <(symbolicate testfile.js.map testfile.profmap) \
  testfile.symbolicated.profmap

can "symbolicate an attribution file" \
  <(symbolicate testfile.js.map --attribution < testfile.attribution.input) \
  testfile.attribution.output

cp testfile.cpuprofile testfile.temp.cpuprofile
($SYMBOLICATE_CMD testfile.cpuprofile.map testfile.temp.cpuprofile)
if ! /usr/bin/diff testfile.temp.cpuprofile -U5 \
  testfile.symbolicated.cpuprofile; then
 rm testfile.temp.cpuprofile
 exit 1
fi
rm testfile.temp.cpuprofile
