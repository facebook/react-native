var jsdom = require('jsdom');

const { JSDOM } = jsdom;

const dom = new JSDOM(`<!DOCTYPE html><html><head><title>WebView</title><base href="/react-native/"><meta property="rn:category" content="APIs" /><link rel="stylesheet" href="css/react-native.css"><link rel="stylesheet" href="css/prism.css"></head><body><div class="inner-content" id="componentContent">expected content</div></body></html>`);
const el = dom.window.document.querySelector("#componentContent");
console.log(el.innerHTML);

console.log(dom.window.document.querySelector("title").innerHTML);
console.log(dom.window.document.querySelector('meta[property="rn:category"]').content);