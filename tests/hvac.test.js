const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const { loadPage } = require('./helpers');

describe('hvac.html — C-20 HVAC Training Page', () => {
  let document, window, evaluate;

  before(() => {
    ({ document, window, evaluate } = loadPage('hvac.html'));
  });

  describe('Page structure', () => {
    it('should have correct page title', () => {
      assert.ok(document.title.includes('C-20 HVAC'));
    });

    it('should have a sticky header', () => {
      assert.ok(document.querySelector('header'));
    });

    it('should have branding with C-20 HVAC', () => {
      const h1 = document.querySelector('.logo h1');
      assert.ok(h1);
      assert.ok(h1.textContent.includes('C-20'));
    });

    it('should have a progress bar', () => {
      assert.ok(document.getElementById('gp'), 'Global progress bar should exist');
      assert.ok(document.getElementById('gpf'), 'Progress fill should exist');
    });
  });

  describe('Tab navigation', () => {
    it('should have tab buttons', () => {
      const tabs = document.querySelectorAll('.tab-btn');
      assert.ok(tabs.length >= 10, `Should have at least 10 tabs, got ${tabs.length}`);
    });

    it('Dashboard tab should be active by default', () => {
      const homePanel = document.getElementById('tab-home');
      assert.ok(homePanel);
      assert.ok(homePanel.classList.contains('active'));
    });

    it('should have all expected tab panels', () => {
      const panels = ['tab-home', 'tab-overview', 'tab-s1', 'tab-s2', 'tab-s3', 'tab-s4',
                       'tab-quiz', 'tab-flashcards', 'tab-math', 'tab-reference', 'tab-plan'];
      for (const id of panels) {
        assert.ok(document.getElementById(id), `Tab panel "${id}" should exist`);
      }
    });

    it('showTab should switch active panel', () => {
      window.showTab('quiz', null);
      assert.ok(document.getElementById('tab-quiz').classList.contains('active'));
      assert.ok(!document.getElementById('tab-home').classList.contains('active'));

      window.showTab('home', null);
      assert.ok(document.getElementById('tab-home').classList.contains('active'));
    });
  });

  describe('Question bank', () => {
    it('should have 30 questions', () => {
      assert.strictEqual(evaluate('allQ.length'), 30);
    });

    it('each question should have required fields', () => {
      const questions = evaluate('allQ');
      for (const q of questions) {
        assert.ok(q.id, 'Should have id');
        assert.ok(q.sec, `Q${q.id} should have section`);
        assert.ok(q.text, `Q${q.id} should have text`);
        assert.ok(Array.isArray(q.opts), `Q${q.id} should have options array`);
        assert.strictEqual(q.opts.length, 4, `Q${q.id} should have 4 options`);
        assert.ok(typeof q.ans === 'number' && q.ans >= 0 && q.ans <= 3, `Q${q.id} answer should be 0-3`);
        assert.ok(q.expl, `Q${q.id} should have explanation`);
        assert.ok(q.ref, `Q${q.id} should have reference`);
      }
    });

    it('should have questions in each section', () => {
      const sections = ['planning', 'install', 'trouble', 'safety'];
      for (const sec of sections) {
        const count = evaluate(`allQ.filter(q => q.sec === '${sec}').length`);
        assert.ok(count > 0, `Section "${sec}" should have questions, got ${count}`);
      }
    });

    it('should have math questions flagged', () => {
      const count = evaluate('allQ.filter(q => q.ismath).length');
      assert.ok(count > 0, 'Should have math questions');
    });
  });

  describe('Quiz engine', () => {
    it('buildQuiz should initialize quiz state', () => {
      evaluate('curFilter = "all"');
      window.buildQuiz();
      assert.ok(evaluate('filteredQ.length') > 0);
      assert.strictEqual(evaluate('qIdx'), 0);
      assert.strictEqual(evaluate('score'), 0);
      assert.strictEqual(evaluate('totalAns'), 0);
    });

    it('setFilter should filter by section', () => {
      const mockBtn = document.createElement('button');
      mockBtn.classList.add('fbtn');
      window.setFilter('safety', mockBtn);
      assert.ok(evaluate('filteredQ.every(q => q.sec === "safety")'));
    });

    it('setFilter with math should filter math questions', () => {
      const mockBtn = document.createElement('button');
      mockBtn.classList.add('fbtn');
      window.setFilter('math', mockBtn);
      assert.ok(evaluate('filteredQ.every(q => q.ismath)'));
    });

    it('selOption should select an answer', () => {
      evaluate('curFilter = "all"');
      window.buildQuiz();
      window.showTab('quiz', null);
      window.selOption(0);
      assert.strictEqual(evaluate('selOpt'), 0);
    });

    it('submitAnswer should score correctly for correct answer', () => {
      evaluate('curFilter = "all"');
      window.buildQuiz();
      window.showTab('quiz', null);

      const correctAns = evaluate('filteredQ[qOrder[0]].ans');
      window.selOption(correctAns);
      window.submitAnswer();
      assert.strictEqual(evaluate('score'), 1);
      assert.strictEqual(evaluate('totalAns'), 1);
      assert.strictEqual(evaluate('answered'), true);
    });

    it('submitAnswer with wrong answer should not increase score', () => {
      evaluate('curFilter = "all"');
      window.buildQuiz();
      window.showTab('quiz', null);

      const correctAns = evaluate('filteredQ[qOrder[0]].ans');
      const wrongAns = (correctAns + 1) % 4;
      window.selOption(wrongAns);
      window.submitAnswer();
      assert.strictEqual(evaluate('score'), 0);
      assert.strictEqual(evaluate('totalAns'), 1);
    });

    it('nextQuestion should advance to next question', () => {
      evaluate('curFilter = "all"');
      window.buildQuiz();
      window.showTab('quiz', null);

      const correctAns = evaluate('filteredQ[qOrder[0]].ans');
      window.selOption(correctAns);
      window.submitAnswer();
      window.nextQuestion();
      assert.strictEqual(evaluate('qIdx'), 1);
    });
  });

  describe('Flashcards', () => {
    it('should have flashcard data', () => {
      const count = evaluate('rawFC.length');
      assert.ok(count >= 30, `Should have at least 30 flashcards, got ${count}`);
    });

    it('each flashcard should have question and answer', () => {
      const cards = evaluate('rawFC');
      for (const fc of cards) {
        assert.strictEqual(fc.length, 2);
        assert.ok(fc[0].length > 0, 'Question should not be empty');
        assert.ok(fc[1].length > 0, 'Answer should not be empty');
      }
    });

    it('renderFC should populate flashcard elements', () => {
      evaluate('fci = 0');
      window.renderFC();
      const qEl = document.getElementById('fc-q');
      const aEl = document.getElementById('fc-a');
      assert.ok(qEl && qEl.textContent.length > 0);
      assert.ok(aEl && aEl.textContent.length > 0);
    });

    it('fcNav should navigate between flashcards', () => {
      evaluate('fci = 0');
      window.renderFC();
      window.fcNav(1);
      assert.strictEqual(evaluate('fci'), 1);
      window.fcNav(-1);
      assert.strictEqual(evaluate('fci'), 0);
    });

    it('fcNav should wrap around', () => {
      evaluate('fci = 0');
      window.fcNav(-1);
      const lastIdx = evaluate('fcs.length - 1');
      assert.strictEqual(evaluate('fci'), lastIdx);
    });

    it('shuffleFC should randomize and reset index', () => {
      window.shuffleFC();
      assert.strictEqual(evaluate('fci'), 0, 'Shuffle should reset to first card');
    });
  });

  describe('Calculators', () => {
    it('calcEER should calculate correctly', () => {
      document.getElementById('eer-btu').value = '24000';
      document.getElementById('eer-w').value = '2400';
      window.calcEER();
      const result = document.getElementById('eer-result').textContent;
      assert.ok(result.includes('10.00'), `EER should be 10.00, got: ${result}`);
    });

    it('calcEER should handle invalid input', () => {
      document.getElementById('eer-btu').value = '';
      document.getElementById('eer-w').value = '';
      window.calcEER();
      const result = document.getElementById('eer-result').textContent;
      assert.ok(result.includes('Enter valid'));
    });

    it('calcHL should calculate heat loss', () => {
      document.getElementById('hl-u').value = '0.06';
      document.getElementById('hl-a').value = '250';
      document.getElementById('hl-dt').value = '35';
      window.calcHL();
      const result = document.getElementById('hl-result').textContent;
      assert.ok(result.includes('525'), `Heat loss should be 525, got: ${result}`);
    });

    it('calcCFM should calculate airflow', () => {
      document.getElementById('cfm-tons').value = '4';
      window.calcCFM();
      const result = document.getElementById('cfm-result').textContent;
      assert.ok(result.includes('1600'), `CFM should be 1600, got: ${result}`);
    });

    it('calcCFMrev should reverse-calculate tonnage', () => {
      document.getElementById('cfm-cfm').value = '1600';
      window.calcCFMrev();
      const result = document.getElementById('cfm-result').textContent;
      assert.ok(result.includes('4.00'), `Tons should be 4.00, got: ${result}`);
    });

    it('calcJC should calculate job cost with overhead', () => {
      document.getElementById('jc-eq').value = '4000';
      document.getElementById('jc-mat').value = '600';
      document.getElementById('jc-hrs').value = '20';
      document.getElementById('jc-rate').value = '90';
      document.getElementById('jc-oh').value = '15';
      window.calcJC();
      const result = document.getElementById('jc-result').textContent;
      assert.ok(result.includes('7360'), `Total should include 7360, got: ${result}`);
    });
  });

  describe('Dashboard', () => {
    it('buildDashProgress should create progress rows', () => {
      window.buildDashProgress();
      const el = document.getElementById('dash-progress');
      assert.ok(el);
      const rows = el.querySelectorAll('.progress-row');
      assert.strictEqual(rows.length, 4);
    });
  });

  describe('Back to Hub link', () => {
    it('should have a link back to index.html', () => {
      const links = document.querySelectorAll('a[href="index.html"]');
      assert.ok(links.length > 0);
    });
  });
});
