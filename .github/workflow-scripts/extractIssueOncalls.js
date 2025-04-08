/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require('fs');

const MSEC_IN_DAY = 1000 * 60 * 60 * 24;

function formatUsers(users) {
  console.log(`${users[0]} ${users[1]}`.trim());
}

function extractUsersFromScheduleAndDate(schedule, userMap, date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0 is January, 1 is February
  const day = date.getDate();
  const dateStr = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
  const user1 = userMap[schedule[dateStr][0]];
  const user2 = userMap[schedule[dateStr][1]];
  return [user1, user2];
}

function main() {
  const configuration = process.argv[2];
  const {userMap, schedule} = JSON.parse(configuration);
  extractIssueOncalls(schedule, userMap);
}

function extractIssueOncalls(schedule, userMap) {
  const now = new Date();
  const dayOfTheWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  let users;
  if (dayOfTheWeek === 2) {
    // exact match in the schedule
    users = extractUsersFromScheduleAndDate(schedule, userMap, now);
  } else if (dayOfTheWeek < 2) {
    // sunday
    // go to the tuesday of the last week
    const lastWeekTuesday = new Date(now - (5 + dayOfTheWeek) * MSEC_IN_DAY);
    users = extractUsersFromScheduleAndDate(schedule, userMap, lastWeekTuesday);
  } else if (dayOfTheWeek > 1) {
    // go to the previous tuesday
    const thisWeekTuesday = new Date(now - (dayOfTheWeek - 2) * MSEC_IN_DAY);
    users = extractUsersFromScheduleAndDate(schedule, userMap, thisWeekTuesday);
  }
  formatUsers(users);
  return users;
}

if (require.main === module) {
  void main();
}

module.exports = {
  extractIssueOncalls,
};
