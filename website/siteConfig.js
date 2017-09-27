/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* List of projects/orgs using your project for the users page */
const users = require('./showcase.json');

const siteConfig = {
  title: "React Native" /* title for your website */,
  url: "https://hramos.github.io" /* your github url */,
  baseUrl: "/react-native/" /* base url for your project */,
  projectName: "react-native",
  repo: "hramos/react-native" /* repo for your project */,
  users,
  /* base url for editing docs, usage example: editUrl + 'en/doc1.md' */
  editUrl: "https://github.com/hramos/react-native/edit/master/docs/",
  /* header links for links on this site, 'LANGUAGE' will be replaced by whatever
     language the page is for, ex: 'en' */
  headerLinks: [
    { doc: "getting-started", label: "Docs" },
    { doc: "components", label: "APIs" },
    { page: "help", label: "Community" },
    { blog: true, label: "Blog" },
    { search: true },
    { href: "https://github.com/hramos/react-native", label: "GitHub" },
    { href: "https://facebook.github.io/react", label: "React" }
  ],
  /* path to images for header/footer */
  headerIcon: "img/header_logo.png",
  disableHeaderTitle: false /* disable title text in header (only show headerIcon) */,
  footerIcon: "img/header_logo.png",
  favicon: "img/favicon.png",
  /* colors for website */
  colors: {
    primaryColor: "rgb(34, 34, 34)",
    secondaryColor: "#05A5D1",
    tintColor: "#005068",
    backgroundColor: "#f5fcff",
    prismColor:
      "rgba(5, 165, 209, 0.05)" /* primaryColor in rgba form, with 0.03 alpha */
  },
  tagline: "A framework for building native apps using React",
  recruitingLink:
    "https://crowdin.com/project/react-native" /* translation site "help translate" link */,
  /* remove this section to disable search bar */
  algolia: {
    apiKey:
      "0f9f28b9ab9efae89810921a351753b5" /* use your search-only api key */,
    indexName: "github"
  },
  facebookAppId: '1677033832619985',
  twitter: 'reactnative'
  /* remove this to disable google analytics tracking */
  /* gaTrackingId: "" */
};

module.exports = siteConfig;
