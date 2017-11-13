/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
"use strict";

const fetch = require("node-fetch");
const filepath = require("filepath");
const fm = require("front-matter");
const fs = require("fs-extra");
const glob = require("glob-promise");
const jsdom = require("jsdom");
const mkdirp = require("mkdirp");
const Promise = require("bluebird");
const shell = require("shelljs");

const convert = require("./convert.js");
const slugify = require("../core/slugify");

const CWD = process.cwd();

const AUTODOCS_PREFIX = "autogen_";
const MARKDOWN_EXTENSION = "md";

const GIT_USER = "hramos"; //process.env.GIT_USER;
const GITHUB_USERNAME = "facebook"; // process.env.GITHUB_USERNAME;
const GITHUB_REPONAME = "react-native"; // process.env.GITHUB_REPONAME;
const remoteBranch = `https://${GIT_USER}@github.com/${GITHUB_USERNAME}/${GITHUB_REPONAME}.git`;

const DOCS_CHECKOUT_DIR = `${GITHUB_REPONAME}-docs`;
const RELEASES_CHECKOUT_DIR = `${GITHUB_REPONAME}-releases`;
const BUILD_DIR = "build";
const DOCS_DIR = "versioned_docs";
const SIDEBAR_DIR = "versioned_sidebars";

const { JSDOM } = jsdom;

// Start up a server. Don't forget to close the connection when done.
const server = require("./server.js");
server.noconvert = true;

const argv = require("minimist")(process.argv.slice(2), {
  alias: {
    c: "clean"
  },
  default: {
    clean: false
  }
});

function extractDocVersionFromFilename(file) {
  const re = new RegExp("/([0-9]*[.]?[0-9]*)");
  return file.match(re)[1];
}

function extractComponentNameFromFilename(file) {
  const re = new RegExp("([A-Za-z-]*).html");
  return file.match(re)[1];
}

function extractMarkdownFromHTMLDocs(file) {
  if (file.indexOf("404") !== -1) {
    return {};
  }
  // console.log(`Processing ${file}`);
  return JSDOM.fromFile(filepath.create(file).toString()).then(dom => {
    const body = bodyContentFromDOM(dom);

    if (!body) {
      return {};
    }
    const componentName = extractComponentNameFromFilename(file);
    const version = extractDocVersionFromFilename(file);
    const markdown = generateMarkdown(componentName, body, version);
    const frontmatter = fm(markdown);
    return { frontmatter, markdown };
  });
}

// DOM FORMATTING FUNCS

function bodyContentFromDOM(dom) {
  const el = dom.window.document.querySelector(".inner-content");
  if (el) {
    return el.innerHTML;
  } else {
    return null;
  }
}

function componentNameFromDOM(dom) {
  const el = dom.window.document.querySelector("h1");
  if (el) {
    let componentName = el.innerHTML;
    const re = new RegExp("docs/([A-Za-z]*)(.html)");
    const parsedTitle = el.innerHTML.match(re);
    if (parsedTitle) {
      componentName = parsedTitle[1];
    }
    return componentName;
  } else {
    return "Component";
  }
}

function componentCategoryFromDOM(dom) {
  const el = dom.window.document.querySelector('meta[property="rn:category"]');
  if (el) {
    return el.content;
  } else {
    return "Components";
  }
}

/**
 * Generates a markdown formatted file, including frontmatter.
 *
 * @param {*} dom
 */
function generateMarkdownFromDOM(dom) {
  const body = bodyContentFromDOM(dom);
  if (!body) {
    return;
  }
  const componentName = componentNameFromDOM(dom);
  const slug = slugify(componentName);
  const markdown = [
    "---",
    "id: " + slug,
    "title: " + componentName,
    "---",
    body
  ]
    .filter(function(line) {
      return line;
    })
    .join("\n");

  return markdown;
}

function generateMarkdown(componentName, body, version) {
  const slug = slugify(componentName);

  let markdown = ["---", "id: " + slug, "title: " + componentName, "---", body];
  if (version) {
    markdown = [
      "---",
      "id: version-" + version + "-" + slug,
      "title: " + componentName,
      "original_id: " + slug,
      "---",
      body
    ];
  }
  return markdown
    .filter(function(line) {
      return line;
    })
    .join("\n");
}

function generateMetatadaFile(categories) {
  const categoriesMetadataFile = `${BUILD_DIR}/sidebar-metadata.json`;
  return fs.outputFile(categoriesMetadataFile, JSON.stringify(categories));
}
// END DOM

function runChecks() {
  if (!shell.which("git")) {
    shell.echo("Sorry, this script requires git");
    shell.exit(1);
  }

  if (!GIT_USER) {
    shell.echo("GIT_USER undefined.");
    shell.exit(1);
  }
  if (!GITHUB_USERNAME) {
    shell.echo("GITHUB_USERNAME undefined.");
    shell.exit(1);
  }
  if (!GITHUB_REPONAME) {
    shell.echo("GITHUB_REPONAME undefined.");
    shell.exit(1);
  }

  console.log("Everything looks good, generating docs.");
}

function cleanFiles() {
  return fs.remove(BUILD_DIR);
}

function generateDocsFromMaster() {
  let docsMetadata = {};

  const pathToGitCheckout = filepath.create(CWD, BUILD_DIR, DOCS_CHECKOUT_DIR);

  const p = Promise.resolve()
    .then(() => {
      return fs.ensureDir(pathToGitCheckout.toString());
    })
    .then(() => {
      shell.cd(pathToGitCheckout.toString());
      return fs.exists(pathToGitCheckout.append(`.git`).toString());
    })
    .then(gitCheckoutExists => {
      if (!gitCheckoutExists) {
        shell.exec(`git init`).code !== 0;

        if (shell.exec(`git remote add origin ${remoteBranch}`).code !== 0) {
          throw new Error("Error: git remote failed");
        }
      }
      return;
    })
    .then(() => {
      if (shell.exec(`git fetch`).code !== 0) {
        throw new Error("Error: git fetch failed");
      }

      shell.exec(`git config core.sparsecheckout true`).code !== 0;
      shell.exec(`echo "docs/*" >> .git/info/sparse-checkout`).code !== 0;

      if (shell.exec(`git checkout master`).code !== 0) {
        throw new Error("Error: git checkout failed");
      }

      return;
    })
    .then(() => {
      return glob("docs/**/*.md");
    })
    .then(files => {
      // Parse every Markdown file and build out our metadata, which can be used later on to generate both the markdown docs in the final location, as well as our sidebar metadata files.
      let seq = Promise.resolve();
      files.forEach(file => {
        console.log("Parsing " + file);
        // e.g. docs/view.md
        seq = seq
          .then(() => {
            return fs.readFile(file, "utf8");
          })
          .then(originalMarkdown => {
            const frontmatter = fm(originalMarkdown);

            if (frontmatter.attributes.layout === "docs") {
              docsMetadata = Object.assign({}, docsMetadata, {
                [frontmatter.attributes.id]: {
                  metadata: frontmatter.attributes,
                  body: frontmatter.body
                }
              });
            }
            return;
          });
      });
      return seq;
    })
    .then(() => {
      // Generate sidebar file...
      const pathToSidebarFile = filepath.create(
        CWD,
        "..",
        "website",
        "sidebars.json"
      );

      let sidebar = {
        docs: {
          Guides: [],
          "Guides (iOS)": [],
          "Guides (Android)": [],
          APIs: [],
          Components: [],
          Contributing: [],
          "The Basics": []
        }
      };

      Object.keys(docsMetadata).forEach(documentId => {
        let category = docsMetadata[documentId].metadata.category;
        if (category === "components") {
          category = "Components";
        }

        // TODO: This is naive. Docs should be in order, and the metadata attribute 'next' lets us know what the order should be.
        sidebar["docs"][category].push(documentId);
      });

      return fs.outputFile(
        pathToSidebarFile.toString(),
        JSON.stringify(sidebar)
      );
    })
    .then(() => {
      // Generate markdown files...

      let seq = Promise.resolve();
      Object.keys(docsMetadata).forEach(documentId => {
        const metadata = docsMetadata[documentId].metadata;
        const body = docsMetadata[documentId].body;

        const transformedMarkdown = [
          "---",
          "id: " + metadata.id,
          "title: " + metadata.title,
          "---",
          body
        ]
          .filter(function(line) {
            return line;
          })
          .join("\n");

        seq = seq.then(() => {
          const pathToMarkdownFile = filepath.create(
            CWD,
            "..",
            "docs",
            metadata.id + ".md"
          );

          return fs.outputFile(
            pathToMarkdownFile.toString(),
            transformedMarkdown
          );
        });
      });

      return seq;
    });

  // STATUS: This is ready, aside from the weird sidebar ordering.
  // Next to do: do the same for releases, below:

  return p;
}

// Must be called after checkOutDocs()
// Check out gh-pages branch
function generateDocsFromPastReleases() {
  // TODO checkout gh-pages

  // if (shell.exec(`git checkout gh-pages`).code !== 0) {
  //   throw new Error("Error: git checkout failed");
  // }

  const pathToGitCheckout = filepath.create(
    CWD,
    BUILD_DIR,
    RELEASES_CHECKOUT_DIR
  );

  let blacklist = [
    "404",
    "index",
    "help",
    "users",
    "showcase",
    "support",
    "versions"
  ];

  let docsVersions = {};
  const p = Promise.resolve()
    .then(() => {
      return fs.ensureDir(pathToGitCheckout.toString());
    })
    .then(() => {
      shell.cd(pathToGitCheckout.toString());
      shell.echo(shell.pwd());
      return fs.exists(pathToGitCheckout.append(`.git`).toString());
    })
    .then(gitCheckoutExists => {
      if (!gitCheckoutExists) {
        shell.exec(`git init`).code !== 0;

        if (shell.exec(`git remote add origin ${remoteBranch}`).code !== 0) {
          throw new Error("Error: git remote failed");
        }
      }
      return;
    })
    .then(() => {
      if (shell.exec(`git fetch`).code !== 0) {
        throw new Error("Error: git fetch failed");
      }

      shell.exec(`git config core.sparsecheckout true`).code !== 0;
      shell.exec(`echo "releases/*" >> .git/info/sparse-checkout`).code !== 0;

      if (shell.exec(`git checkout gh-pages`).code !== 0) {
        throw new Error("Error: git checkout failed");
      }

      return;
    })
    .then(() => {
      return glob("releases/**/*.html");
    })
    .then(files => {
      // Parse every Markdown file and build out our metadata, which can be used later on to generate both the markdown docs in the final location, as well as our sidebar metadata files.
      let seq = Promise.resolve();
      files.forEach(file => {
        console.log("Parsing " + file);
        // e.g. docs/view.md
        seq = seq
          .then(() => {
            return extractMarkdownFromHTMLDocs(file);
          })
          .then(res => {
            if (res.markdown === undefined) {
              console.log("Skipping " + file + " for lack of markdown.");
              return;
            }

            const version = extractDocVersionFromFilename(file);
            if (!version) {
              console.log("Skipping " + file + " for lack of version.");
              return;
            }

            const frontmatter = res.frontmatter;

            // have to implement some sort of check to ensure this is a docs file.
            if (!blacklist.includes(frontmatter.attributes.original_id)) {
              if (!docsVersions.hasOwnProperty(version)) {
                docsVersions[version] = {};
              }

              docsVersions[version] = Object.assign({}, docsVersions[version], {
                [frontmatter.attributes.id]: {
                  metadata: frontmatter.attributes,
                  body: frontmatter.body,
                  version
                }
              });
            }
            return;
          });
      });
      return seq;
    })
    .then(() => {
      let seq = Promise.resolve();
      Object.keys(docsVersions).forEach(version => {
        seq.then(() => {
          // Generate sidebar file...

          const docsMetadata = docsVersions[version];
          let documents = Object.keys(docsMetadata);
          // TODO: We don't have old docs' categories
          let sidebar = {
            ["version-" + version + "-docs"]: {
              Docs: documents
            }
          };

          const pathToSidebarFile = filepath.create(
            CWD,
            "..",
            "website",
            "versioned_sidebars",
            "version-" + version + "-sidebars.json"
          );

          return fs.outputFile(
            pathToSidebarFile.toString(),
            JSON.stringify(sidebar)
          );
        });
        return seq;
      });
    })
    .then(() => {
      // Generate markdown files...
      let seq = Promise.resolve();
      Object.keys(docsVersions).forEach(version => {
        const docsMetadata = docsVersions[version];

        Object.keys(docsMetadata).forEach(documentId => {
          const metadata = docsMetadata[documentId].metadata;
          const body = docsMetadata[documentId].body;

          const transformedMarkdown = [
            "---",
            "id: " + metadata.id,
            "original_id: " + metadata.original_id,
            "title: " + metadata.title,
            "---",
            body
          ]
            .filter(function(line) {
              return line;
            })
            .join("\n");

          seq = seq.then(() => {
            const pathToMarkdownFile = filepath.create(
              CWD,
              "..",
              "website",
              "versioned_docs",
              version,
              metadata.original_id + ".md"
            );

            return fs.outputFile(
              pathToMarkdownFile.toString(),
              transformedMarkdown
            );
          });
        });
      });
      return seq;
    })
    // .then(() => {
    //   filepath.create(CWD, "..", "website", SIDEBAR_DIR);
    //   for (const version in sidebarMetadata) {
    //     if (sidebarMetadata.hasOwnProperty(version)) {
    //       const documents = sidebarMetadata[version];
    //       let sidebar = {};
    //       sidebar[`version-${version}-docs`] = { APIs: documents };

    //       const pathToSidebarFile = filepath.create(
    //         CWD,
    //         "..",
    //         "website",
    //         SIDEBAR_DIR,
    //         `version-${version}-sidebars.json`
    //       );
    //       console.log(`Writing ${pathToSidebarFile}: ${sidebar}`);

    //       fs.outputFileSync(
    //         pathToSidebarFile.toString(),
    //         JSON.stringify(sidebar)
    //       );
    //     }
    //   }
    //   return;
    // })
    // .then(() => {
    //   filepath.create(CWD, BUILD_DIR, SIDEBAR_DIR);
    //   const versions = Object.keys(sidebarMetadata);

    //   const pathToVersionsFile = filepath.create(
    //     CWD,
    //     BUILD_DIR,
    //     `versions.json`
    //   );
    //   return fs.outputFile(
    //     pathToVersionsFile.toString(),
    //     JSON.stringify(versions.reverse())
    //   );
    // })
    .then(() => {
      console.log("Finished with releases");
      return;
      //   shell.cd(CWD);
      //   shell.cd(BUILD_DIR);
      //   shell.cd(CHECKOUT_DIR);

      //   shell.exec(`git config core.sparsecheckout true`).code !== 0;
      //   shell.exec(`echo "docs/*" >> .git/info/sparse-checkout`).code !== 0;

      //   if (shell.exec(`git checkout master`).code !== 0) {
      //     throw new Error('Error: git checkout failed');
      //   }

      //   // maybe should clear out before?
      //   shell.cp('-r', 'docs/*.md', '../../docs/.');

      //   return glob('docs/**/*.md');
      // }).then(() => {
      //   // now we handle sidebarring
      //   // and make versioned sidebar?
      //   return; //copy
      // }).then(() => {
      //   // then finally we run docgen over Libraries/...
    });

  return p;
}

if (argv.clean) {
  cleanFiles();
}

runChecks();
console.log("Calling generateDocsFromMaster");
generateDocsFromMaster()
  .then(() => {
    console.log("Calling generateDocsFromPastReleases");
    return generateDocsFromPastReleases();
  })
  .then(() => {
    console.log("Finished");
    shell.exec("say Finished");
    process.exit(0);
  });

/**
 * Check out gh-pages branch, cd releases/
 * For each version,
 * For each HTML,
 * Parse out jsdom
 * Get body contents
 * Generate frontmatter
 * Save into versioned_docs
 * Then finally generate sidebar files for each version
 *
 */
