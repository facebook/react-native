/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const React = require("react");

const githubButton = (
  <a
    className="github-button"
    href="https://github.com/deltice/test-site"
    data-icon="octicon-star"
    data-count-href="/deltice/test-site/stargazers"
    data-count-api="/repos/deltice/test-site#stargazers_count"
    data-count-aria-label="# stargazers on GitHub"
    aria-label="Star this project on GitHub"
  >
    Star
  </a>
);

class Footer extends React.Component {
  render() {
    const currentYear = new Date().getFullYear();
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            <img
              src={this.props.config.baseUrl + this.props.config.footerIcon}
              alt={this.props.config.title}
              width="66"
              height="58"
            />
          </a>
          <div>
            <h5>Docs</h5>
            <a
              href={
                this.props.config.baseUrl +
                "docs/" +
                this.props.language +
                "/doc1.html"
              }
            >
              Getting Started (or other categories)
            </a>
            <a
              href={
                this.props.config.baseUrl +
                "docs/" +
                this.props.language +
                "/doc2.html"
              }
            >
              Guides (or other categories)
            </a>
            <a
              href={
                this.props.config.baseUrl +
                "docs/" +
                this.props.language +
                "/doc3.html"
              }
            >
              API Reference (or other categories)
            </a>
          </div>
          <div>
            <h5>Community</h5>
            <a
              href={
                this.props.config.baseUrl + this.props.language + "/users.html"
              }
            >
              User Showcase
            </a>
            <a
              href="http://stackoverflow.com/questions/tagged/"
              target="_blank"
            >
              Stack Overflow
            </a>
            <a href="https://discordapp.com/">Project Chat</a>
            <a href="https://twitter.com/" target="_blank">
              Twitter
            </a>
          </div>
          <div>
            <h5>More</h5>
            <a href={this.props.config.baseUrl + "blog"}>Blog</a>
            <a href="https://github.com/">GitHub</a>
            {githubButton}
          </div>
        </section>

        <a
          href="https://code.facebook.com/projects/"
          target="_blank"
          className="fbOpenSource"
        >
          <img
            src={this.props.config.baseUrl + "img/oss_logo.png"}
            alt="Facebook Open Source"
            width="170"
            height="45"
          />
        </a>
        <section className="copyright">
          Copyright &copy; {currentYear} Facebook Inc.
        </section>
      </footer>
    );
  }
}

module.exports = Footer;
