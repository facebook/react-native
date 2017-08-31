# React Native Docs Generator

The React Native website is generated from a collection of markdown documents. This directory holds a collection of scripts necessary to generate these markdown docs prior to the site being built.

## import-existing-docs.js

For development use only. This script will pull down the current docs from master, and apply any transformations necessary to host the docs under the new website build script.

### Usage

Run the following command locally:

```
GIT_USER=your_git_user GITHUB_USERNAME=facebook GITHUB_REPONAME=react-native node server/import-existing-docs.js 
```

This will perform a sparse checkout of the `docs/` folder from `master`, generating a clean set of markdown docs in the local `docs/` folder. It will also write to disk an updated `sidebars.json` file based on these docs.

## build-autodocs-markdownjs

Runs the usual autodocs generation scripts used by the `react-page-middleware` variant of the React Native website, but provides markdown instead of HTML. Run this script prior to building the website.

### Usage

Run the following commands locally (the generate script needs to run first):

```
node server/build-autodocs-markdown.js
```