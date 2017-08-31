/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
"use strict";

var fs = require("fs");

const categoriesMetadataFile = "build/sidebar-metadata.json";
const categories = JSON.parse(fs.readFileSync(categoriesMetadataFile));
const sidebarFile = "../website/sidebars.json";
let sidebarContent = { SIDEBAR_AUTODOCS_SECTION: {} };
if (fs.existsSync(sidebarFile)) {
  sidebarContent = JSON.parse(fs.readFileSync(sidebarFile));
}

let sortedCategories = {};
for (var category in categories) {
  const sortedCategory = categories[category].sort();
  sortedCategories[category] = sortedCategory;
}

const newSidebarContent = Object.assign({}, sidebarContent, {
  API: sortedCategories
});

fs.writeFileSync(sidebarFile, JSON.stringify(newSidebarContent));
console.log(`Updated ${sidebarFile}`);
