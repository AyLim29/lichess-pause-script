// ==UserScript==
// @name         Lichess Pause
// @namespace    http://tampermonkey.net/
// @version      2025-11-12
// @description  try to take over the world!
// @author       You
// @match        https://lichess.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lichess.org
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    const regexClass = /mortime/i;
    const regexTitle = /Give 15 seconds/i;

    const regexOppClock = /rclock.rclock-top.rclock-.*/;
    const regexTime = /^time( hour|)$/i;

    // state variables
    let isPaused = false;
    let pausedAt = null;

    function isAddMoreButton(el) {
        return regexClass.test(el.className || '') || regexTitle.test(el.getAttribute('title') || '');
    }

    function isOppTime(el) {
        return regexTime.test(el.className) && regexOppClock.test(el.parentElement.className);
    }

    // Function to update all pause buttons based on global state
    function updateAllButtons() {
        const allButtons = document.querySelectorAll('[title="pause-button"]');
        allButtons.forEach(btn => {
            btn.setAttribute('data-icon', isPaused ? '▶︎' : '❚❚');
        });
    }

    function addPauseButton(oppTime) {
        const elements = document.querySelectorAll('*'); // all elements, or narrow to e.g. 'div, span, a'

        elements.forEach(el => {
            if (isAddMoreButton(el)) {
                if (el.dataset.hasAddedBtn) return; // avoid duplicates

                el.dataset.hasAddedBtn = 'true';

                const pauseBtn = el.cloneNode(true);
                pauseBtn.title = 'pause-button';
                pauseBtn.setAttribute('data-icon', isPaused ? '▶︎' : '❚❚');

                pauseBtn.addEventListener('click', () => {
                    isPaused = !isPaused;
                    updateAllButtons();

                    if (isPaused) {
                        pausedAt = oppTime.textContent
                    }
                });

                el.insertAdjacentElement('afterend', pauseBtn);
            }
        });
    }

    function getTimeSeconds(timeStr) {
        const timeSplit = timeStr.split(":")
        const arrayLength = timeSplit.length
        const hour = arrayLength == 3 ? parseInt(timeSplit[timeSplit.length - 3], 10) : 0;
        const minute = parseInt(timeSplit[timeSplit.length - 2], 10);
        const second = parseInt(timeSplit[timeSplit.length - 1], 10);
        return hour * 60 * 60 + minute * 60 + second
    }

    function pauseGame(oppTime) {
        if (isPaused) {
            const oppTimeSeconds = getTimeSeconds(oppTime.textContent)
            const pauseAtSeconds = getTimeSeconds(pausedAt)

            if ((pauseAtSeconds + 15 - oppTimeSeconds) >= 15) {
                const elements = document.querySelectorAll('*');
                elements.forEach(el => {
                    if (isAddMoreButton(el)) {
                        el.click();
                    }
                });
            }
        }
    }

    // Handle added nodes
    function handleMutations(mutationsList) {
        for (const mutation of mutationsList) {
            if (isOppTime(mutation.target)) {
                addPauseButton(mutation.target);
                pauseGame(mutation.target);
            }
        }
    }

    // Run once on load
    window.addEventListener('load', addPauseButton);

    // re-run if page changes
    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, { childList: true, subtree: true });
})();
