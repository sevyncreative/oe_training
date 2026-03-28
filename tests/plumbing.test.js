const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const { loadPage } = require('./helpers');

describe('plumbing.html — C-36 Plumbing Training Page', () => {
  let document, window, evaluate;

  before(() => {
    ({ document, window, evaluate } = loadPage('plumbing.html'));
  });

  describe('Page structure', () => {
    it('should have correct page title', () => {
      assert.ok(document.title.includes('C-36 Plumbing'));
    });

    it('should have a sticky header', () => {
      assert.ok(document.querySelector('header'));
    });

    it('should have branding with C-36', () => {
      const h1 = document.querySelector('.logo h1');
      assert.ok(h1);
      assert.ok(h1.textContent.includes('C-36'));
    });

    it('should have a progress bar', () => {
      assert.ok(document.getElementById('global-progress-bar'));
      assert.ok(document.getElementById('global-progress-fill'));
    });
  });

  describe('Tab navigation', () => {
    it('should have tab buttons', () => {
      const tabs = document.querySelectorAll('.tab-btn');
      assert.ok(tabs.length >= 11, `Should have at least 11 tabs, got ${tabs.length}`);
    });

    it('Dashboard tab should be active by default', () => {
      const homePanel = document.getElementById('tab-home');
      assert.ok(homePanel);
      assert.ok(homePanel.classList.contains('active'));
    });

    it('should have all expected tab panels', () => {
      const panels = ['tab-home', 'tab-overview', 'tab-study1', 'tab-study2', 'tab-study3',
                       'tab-study4', 'tab-study5', 'tab-quiz', 'tab-flashcards', 'tab-math',
                       'tab-reference', 'tab-plan'];
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

    it('showTab should activate the tab button', () => {
      const btn = document.createElement('button');
      btn.classList.add('tab-btn');
      window.showTab('overview', btn);
      assert.ok(btn.classList.contains('active'));
    });
  });

  describe('Question bank', () => {
    it('should have 30 questions', () => {
      assert.strictEqual(evaluate('allQuestions.length'), 30);
    });

    it('each question should have required fields', () => {
      const questions = evaluate('allQuestions');
      for (const q of questions) {
        assert.ok(q.id, 'Should have id');
        assert.ok(q.section, `Q${q.id} should have section`);
        assert.ok(q.text, `Q${q.id} should have text`);
        assert.ok(Array.isArray(q.options), `Q${q.id} should have options array`);
        assert.strictEqual(q.options.length, 4, `Q${q.id} should have 4 options`);
        assert.ok(typeof q.answer === 'number' && q.answer >= 0 && q.answer <= 3, `Q${q.id} answer should be 0-3`);
        assert.ok(q.explanation, `Q${q.id} should have explanation`);
        assert.ok(q.codeRef, `Q${q.id} should have code reference`);
      }
    });

    it('should have questions in each section', () => {
      const sections = ['planning', 'underground', 'finish', 'repair', 'safety'];
      for (const sec of sections) {
        const count = evaluate(`allQuestions.filter(q => q.section === '${sec}').length`);
        assert.ok(count > 0, `Section "${sec}" should have questions, got ${count}`);
      }
    });

    it('should have math questions flagged', () => {
      const count = evaluate('allQuestions.filter(q => q.ismath).length');
      assert.ok(count > 0, 'Should have math questions');
    });

    it('question IDs should be unique', () => {
      const ids = evaluate('allQuestions.map(q => q.id)');
      const uniqueIds = new Set(ids);
      assert.strictEqual(uniqueIds.size, ids.length, 'All question IDs should be unique');
    });
  });

  describe('Quiz engine', () => {
    it('buildQuiz should initialize quiz state', () => {
      evaluate('currentFilter = "all"');
      window.buildQuiz();
      assert.ok(evaluate('filteredQuestions.length') > 0);
      assert.strictEqual(evaluate('currentIdx'), 0);
      assert.strictEqual(evaluate('score'), 0);
      assert.strictEqual(evaluate('totalAnswered'), 0);
    });

    it('setFilter should filter by section', () => {
      const mockBtn = document.createElement('button');
      mockBtn.classList.add('filter-btn');
      window.setFilter('safety', mockBtn);
      assert.ok(evaluate('filteredQuestions.every(q => q.section === "safety")'));
    });

    it('setFilter with math should filter math questions', () => {
      const mockBtn = document.createElement('button');
      mockBtn.classList.add('filter-btn');
      window.setFilter('math', mockBtn);
      assert.ok(evaluate('filteredQuestions.every(q => q.ismath)'));
    });

    it('selectOption should select an answer', () => {
      evaluate('currentFilter = "all"');
      window.buildQuiz();
      window.showTab('quiz', null);
      window.selectOption(0);
      assert.strictEqual(evaluate('selectedOption'), 0);
    });

    it('submitAnswer should score correct answer', () => {
      evaluate('currentFilter = "all"');
      window.buildQuiz();
      window.showTab('quiz', null);

      const correctAns = evaluate('filteredQuestions[quizOrder[0]].answer');
      window.selectOption(correctAns);
      window.submitAnswer();
      assert.strictEqual(evaluate('score'), 1);
      assert.strictEqual(evaluate('totalAnswered'), 1);
      assert.strictEqual(evaluate('answered'), true);
    });

    it('submitAnswer with wrong answer should not increase score', () => {
      evaluate('currentFilter = "all"');
      window.buildQuiz();
      window.showTab('quiz', null);

      const correctAns = evaluate('filteredQuestions[quizOrder[0]].answer');
      const wrongAns = (correctAns + 1) % 4;
      window.selectOption(wrongAns);
      window.submitAnswer();
      assert.strictEqual(evaluate('score'), 0);
      assert.strictEqual(evaluate('totalAnswered'), 1);
    });

    it('nextQuestion should advance to next question', () => {
      evaluate('currentFilter = "all"');
      window.buildQuiz();
      window.showTab('quiz', null);

      const correctAns = evaluate('filteredQuestions[quizOrder[0]].answer');
      window.selectOption(correctAns);
      window.submitAnswer();
      window.nextQuestion();
      assert.strictEqual(evaluate('currentIdx'), 1);
    });

    it('completing all questions should show score panel', () => {
      evaluate('currentFilter = "all"');
      window.buildQuiz();
      window.showTab('quiz', null);

      const total = evaluate('quizOrder.length');
      for (let i = 0; i < total; i++) {
        const ans = evaluate(`filteredQuestions[quizOrder[${i}]].answer`);
        window.selectOption(ans);
        window.submitAnswer();
        if (i < total - 1) {
          window.nextQuestion();
        }
      }
      window.nextQuestion();

      const scorePanel = document.getElementById('score-panel');
      assert.strictEqual(scorePanel.style.display, 'block');
      const pctEl = document.getElementById('final-pct');
      assert.ok(pctEl.textContent.includes('100%'));
    });
  });

  describe('Flashcards', () => {
    it('should have flashcard data', () => {
      const count = evaluate('rawFlashcards.length');
      assert.ok(count >= 28, `Should have at least 28 flashcards, got ${count}`);
    });

    it('each flashcard should have question and answer', () => {
      const cards = evaluate('rawFlashcards');
      for (const fc of cards) {
        assert.strictEqual(fc.length, 2);
        assert.ok(fc[0].length > 0);
        assert.ok(fc[1].length > 0);
      }
    });

    it('renderFlashcard should populate elements', () => {
      evaluate('fcIndex = 0');
      window.renderFlashcard();
      const qEl = document.getElementById('fc-question');
      const aEl = document.getElementById('fc-answer');
      assert.ok(qEl && qEl.textContent.length > 0);
      assert.ok(aEl && aEl.textContent.length > 0);
    });

    it('fcNav should navigate between flashcards', () => {
      evaluate('fcIndex = 0');
      window.renderFlashcard();
      window.fcNav(1);
      assert.strictEqual(evaluate('fcIndex'), 1);
      window.fcNav(-1);
      assert.strictEqual(evaluate('fcIndex'), 0);
    });

    it('fcNav should wrap around', () => {
      evaluate('fcIndex = 0');
      window.fcNav(-1);
      const lastIdx = evaluate('flashcards.length - 1');
      assert.strictEqual(evaluate('fcIndex'), lastIdx);
    });

    it('shuffleCards should reset index', () => {
      window.shuffleCards();
      assert.strictEqual(evaluate('fcIndex'), 0);
    });
  });

  describe('Calculators', () => {
    it('calcSlope should calculate drain pipe drop', () => {
      document.getElementById('slope-length').value = '20';
      document.getElementById('slope-rate').value = '0.25';
      window.calcSlope();
      const result = document.getElementById('slope-result').textContent;
      assert.ok(result.includes('5.000'), `Drop should be 5.000, got: ${result}`);
    });

    it('calcSlope should handle invalid input', () => {
      document.getElementById('slope-length').value = '';
      document.getElementById('slope-rate').value = '';
      window.calcSlope();
      const result = document.getElementById('slope-result').textContent;
      assert.ok(result.includes('Enter valid'));
    });

    it('calcCost should calculate job cost', () => {
      document.getElementById('cost-mat').value = '500';
      document.getElementById('cost-hrs').value = '32';
      document.getElementById('cost-rate').value = '70';
      document.getElementById('cost-eqdays').value = '4';
      document.getElementById('cost-eqrate').value = '400';
      document.getElementById('cost-overhead').value = '10';
      window.calcCost();
      const result = document.getElementById('cost-result').textContent;
      assert.ok(result.includes('4774'), `Total should include 4774, got: ${result}`);
    });

    it('calcDFU should calculate drainage fixture units', () => {
      window.buildDFU();
      const inputs = document.querySelectorAll('#dfu-inputs input');
      // 1 private lavatory (1 DFU) + 1 bathtub (2 DFU) + 1 private WC (4 DFU) = 7
      inputs[0].value = '1';
      inputs[2].value = '1';
      inputs[4].value = '1';
      window.calcDFU();
      const result = document.getElementById('dfu-result').textContent;
      assert.ok(result.includes('Total DFU: 7'), `Should be 7 DFU, got: ${result}`);
    });

    it('calcDFU should recommend correct pipe size', () => {
      window.buildDFU();
      const inputs = document.querySelectorAll('#dfu-inputs input');
      inputs.forEach(i => i.value = '0');
      // 5 public WCs = 30 DFU -> 4" pipe
      inputs[5].value = '5';
      window.calcDFU();
      const result = document.getElementById('dfu-result').textContent;
      assert.ok(result.includes('4"'), `Should recommend 4" pipe, got: ${result}`);
    });
  });

  describe('Dashboard', () => {
    it('buildDashboardProgress should create progress rows', () => {
      window.buildDashboardProgress();
      const el = document.getElementById('dashboard-progress');
      assert.ok(el);
      const rows = el.querySelectorAll('.progress-row');
      assert.strictEqual(rows.length, 5);
    });
  });

  describe('Back to Hub link', () => {
    it('should have a link back to index.html', () => {
      const links = document.querySelectorAll('a[href="index.html"]');
      assert.ok(links.length > 0);
    });
  });

  describe('Meta tags', () => {
    it('should have UTF-8 charset', () => {
      const meta = document.querySelector('meta[charset]');
      assert.ok(meta);
      assert.strictEqual(meta.getAttribute('charset'), 'UTF-8');
    });

    it('should have viewport meta tag for mobile', () => {
      const meta = document.querySelector('meta[name="viewport"]');
      assert.ok(meta);
      assert.ok(meta.getAttribute('content').includes('width=device-width'));
    });
  });
});
