const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const { loadPage } = require('./helpers');

describe('index.html — Landing Page', () => {
  let document, window;

  before(() => {
    ({ document, window } = loadPage('index.html'));
  });

  describe('Page structure', () => {
    it('should have correct page title', () => {
      assert.ok(document.title.includes('California Contractor License Exam Prep'));
    });

    it('should have a header with logo', () => {
      const header = document.querySelector('header');
      assert.ok(header, 'Header element should exist');
      const logo = header.querySelector('.logo-icon');
      assert.ok(logo, 'Logo icon should exist');
    });

    it('should have the site branding text', () => {
      const h1 = document.querySelector('.logo h1');
      assert.ok(h1, 'Logo h1 should exist');
      assert.strictEqual(h1.textContent, 'EXAM PREP');
    });

    it('should have a subtitle describing the site', () => {
      const subtitle = document.querySelector('.logo p');
      assert.ok(subtitle);
      assert.ok(subtitle.textContent.includes('California Contractor License Training'));
    });
  });

  describe('Hero section', () => {
    it('should have a hero heading', () => {
      const h2 = document.querySelector('.hero-text h2');
      assert.ok(h2);
      assert.ok(h2.textContent.includes('Choose Your'));
      assert.ok(h2.textContent.includes('Training Track'));
    });

    it('should have a description paragraph', () => {
      const p = document.querySelector('.hero-text p');
      assert.ok(p);
      assert.ok(p.textContent.includes('Interactive exam prep'));
    });
  });

  describe('Course cards', () => {
    it('should have exactly 2 course cards', () => {
      const cards = document.querySelectorAll('.card');
      assert.strictEqual(cards.length, 2);
    });

    it('should have an HVAC card with correct content', () => {
      const hvacCard = document.querySelector('.card--hvac');
      assert.ok(hvacCard, 'HVAC card should exist');
      const h3 = hvacCard.querySelector('h3');
      assert.ok(h3.textContent.includes('C-20 HVAC'));
    });

    it('should have a Plumbing card with correct content', () => {
      const plumbingCard = document.querySelector('.card--plumbing');
      assert.ok(plumbingCard, 'Plumbing card should exist');
      const h3 = plumbingCard.querySelector('h3');
      assert.ok(h3.textContent.includes('C-36 Plumbing'));
    });

    it('HVAC card should have feature list items', () => {
      const features = document.querySelectorAll('.card--hvac .card-features li');
      assert.ok(features.length >= 4, 'HVAC card should have at least 4 features');
      const texts = Array.from(features).map(f => f.textContent);
      assert.ok(texts.some(t => t.includes('Timed practice exams')));
      assert.ok(texts.some(t => t.includes('Detailed answer explanations')));
    });

    it('Plumbing card should have feature list items', () => {
      const features = document.querySelectorAll('.card--plumbing .card-features li');
      assert.ok(features.length >= 4, 'Plumbing card should have at least 4 features');
    });
  });

  describe('Navigation links', () => {
    it('HVAC card should link to hvac.html', () => {
      const link = document.querySelector('.card--hvac .card-btn');
      assert.ok(link);
      assert.strictEqual(link.getAttribute('href'), 'hvac.html');
      assert.ok(link.textContent.includes('Start HVAC Training'));
    });

    it('Plumbing card should link to plumbing.html', () => {
      const link = document.querySelector('.card--plumbing .card-btn');
      assert.ok(link);
      assert.strictEqual(link.getAttribute('href'), 'plumbing.html');
      assert.ok(link.textContent.includes('Start Plumbing Training'));
    });
  });

  describe('Footer', () => {
    it('should have a footer element', () => {
      const footer = document.querySelector('footer');
      assert.ok(footer);
      assert.ok(footer.textContent.includes('California Contractor License Exam Prep'));
    });
  });

  describe('Meta tags', () => {
    it('should have UTF-8 charset', () => {
      const meta = document.querySelector('meta[charset]');
      assert.ok(meta);
      assert.strictEqual(meta.getAttribute('charset'), 'UTF-8');
    });

    it('should have viewport meta tag', () => {
      const meta = document.querySelector('meta[name="viewport"]');
      assert.ok(meta);
      assert.ok(meta.getAttribute('content').includes('width=device-width'));
    });
  });
});
