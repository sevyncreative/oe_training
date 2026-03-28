const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

/**
 * Load an HTML file into a jsdom instance with scripts executed.
 * Returns { window, document, dom }.
 */
function loadPage(filename) {
  const filePath = path.resolve(__dirname, '..', filename);
  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: `file://${path.resolve(__dirname, '..')}/`,
    pretendToBeVisual: true,
  });

  // Stub browser APIs not available in jsdom
  dom.window.scrollTo = () => {};
  dom.window.scroll = () => {};

  // Trigger DOMContentLoaded for init code
  const event = new dom.window.Event('DOMContentLoaded');
  dom.window.document.dispatchEvent(event);

  /**
   * Evaluate an expression in the page's script scope.
   * Use this to access const/let variables that aren't on window.
   */
  function evaluate(expr) {
    return dom.window.eval(expr);
  }

  return {
    window: dom.window,
    document: dom.window.document,
    dom,
    evaluate,
  };
}

module.exports = { loadPage };
