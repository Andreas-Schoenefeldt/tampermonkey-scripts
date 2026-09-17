// ==UserScript==
// @name         Redmine Improvements
// @namespace    https://redmine.flowconcept.de/
// @version      2026-09-17
// @description  Add improvements for redmine for faster work
// @author       Andreas Schönefeldt
// @match        https://redmine.flowconcept.de/*
// @updateURL    https://github.com/Andreas-Schoenefeldt/tampermonkey-scripts/blob/main/redmine.user.js
// @downloadURL  https://github.com/Andreas-Schoenefeldt/tampermonkey-scripts/blob/main/redmine.user.js
// @icon         https://redmine.flowconcept.de/favicon.ico
// @grant        none
// ==/UserScript==

(function (){

  const fieldSetCurrentDate = (field) => field.value || new Date().toISOString().slice(0, 10);
  const fieldSetStatus = (statusArray) => {
    return (field) => statusArray.find(v => field.querySelector(`option[value="${v}"]`));
  };

  const READY_FOR_REVIEW_ACTIONS = {
    '#issue_done_ratio': () => 100,
    '#issue_start_date': fieldSetCurrentDate,
    '#issue_assigned_to_id': (field, form) => form.querySelector('#issue_av_id')?.value,
    '#issue_status_id': fieldSetStatus([11, 4, 2, 3]),
    '#issue_notes': (field) => field.value || 'Ist erledigt :)',
  };

  const START_PROGRESS_ACTIONS = {
    '#issue_assigned_to_id': (field) => {
      const myself = [...field.options].find(o => o.textContent.trim() === '<< ich >>');
      return myself?.value;
    },
    '#issue_start_date': fieldSetCurrentDate,
    '#issue_status_id': fieldSetStatus([2, 4]),
  };

  const NEED_FEEDBACK_ACTIONS = {
    '#issue_assigned_to_id': (field, form) => form.querySelector('#issue_av_id')?.value,
    '#issue_start_date': fieldSetCurrentDate,
    '#issue_status_id': fieldSetStatus([4, 2]),
  }

  const AV_STORAGE_KEY = 'redmine_av_value';

  function getProject() {
    return document.querySelector('.current-project').textContent.trim();
  }

  function applyFieldActions(form, actions) {
    for (const [selector, resolve] of Object.entries(actions)) {
      const field = form.querySelector(selector);
      if (!field) continue;

      const value = resolve(field, form);
      if (value === undefined || String(value) === field.value) continue;

      field.value = value;
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function injectAvSelect(form) {
    const assignedTo = form.querySelector('#issue_assigned_to_id');
    if (!assignedTo || form.dataset.avSelectjected) return;
    form.dataset.avSelectjected = 'true';

    const label = document.createElement('label');
    label.htmlFor = 'issue_av_id';
    label.textContent = 'AV';

    const select = assignedTo.cloneNode(true);
    select.id = 'issue_av_id';
    select.name = 'issue_av'; // not submitted as part of the issue form

    const project = getProject();
    let stored = localStorage.getItem(AV_STORAGE_KEY);
    try {
      stored = JSON.parse(stored);
    } catch (e) {
      stored = {};
    }

    const av = stored[project] || '';

    if (av && select.querySelector(`option[value="${av}"]`)) {
      select.value = av;
    }

    select.addEventListener('change', () => {
      stored[project] = select.value;
      localStorage.setItem(AV_STORAGE_KEY, JSON.stringify(av));
    });

    const wrapper = document.createElement('p');
    wrapper.title = 'Allgemein Verantwortlich';
    wrapper.append(label, select);

    assignedTo.closest('p')?.insertAdjacentElement('afterend', wrapper)
    ?? assignedTo.insertAdjacentElement('afterend', wrapper);
  }

  function injectActionButton(form, { id, label, actions }) {
    if (form.querySelector(`#${id}`)) return;

    const btn = document.createElement('button');
    btn.id = id;
    btn.type = 'button';
    btn.style.marginRight = '1rem';
    btn.textContent = label;
    btn.addEventListener('click', () => applyFieldActions(form, actions));

    form.querySelector('.box > fieldset').prepend(btn);
  }


  function checkForm() {
    const form = document.querySelector('form.edit_issue#issue-form');
    if (form) {
      injectActionButton(form, {
        id: 'ready-for-review-btn',
        label: 'Ready for Review',
        actions: READY_FOR_REVIEW_ACTIONS,
      });
      injectActionButton(form, {
        id: 'start-progress-btn',
        label: 'Start Progress',
        actions: START_PROGRESS_ACTIONS,
      });
      injectActionButton(form, {
        id: 'need-feedback-button',
        label: 'Need Feedback',
        actions: NEED_FEEDBACK_ACTIONS,
      })
      injectAvSelect(form);
    }
  }


  checkForm();

  // Redmine reloads parts of the DOM via AJAX (e.g. issue updates) without full page reload
  new MutationObserver(checkForm).observe(document.body, {
    childList: true,
    subtree: true,
  });

})()
