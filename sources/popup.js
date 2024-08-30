const getCurrentTabId = async () => {
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    return tab?.id ?? null;
};

const show = (...elementSelectors) => {
    elementSelectors.forEach((selector) => {
        const elt = document.querySelector(selector);
        elt.classList.remove('hidden');
    });
};

const hide = (...elementSelectors) => {
    elementSelectors.forEach((selector) => {
        const elt = document.querySelector(selector);
        console.log({selector, elt});
        elt.classList.add('hidden');
    });
};

const setText = (elementSelector, text) => {
    document.querySelector(elementSelector).innerHTML = text;
};

const Settings = Object.freeze({
    allMedalsSize: 13,
    imageSize: 48,
    linkPerRow: 10,
    popupHeight: 488,
    popupWidth: 624,
    spacing: 16,
    zoom: 10,
});

const battleParisEnhancer = {

    checkPage: function () {
        const obj = this;
        chrome.tabs.query({
            active: true,
            lastFocusedWindow: true
        }, async (tabs) => {
            const [{url}] = tabs;
            if (url.indexOf('battle.paris/medal/') > -1 || url.indexOf('battleparis.com/medal/') > -1) {
                // Medal page
                await obj.checkLoggedUser();
            } else {
                // Not a medal page: display links to all medals
                obj.displayAllMedals();
            }
        });
    },

    displayAllMedals: function () {
        const bodyElt = document.querySelector('body');
        bodyElt.style.height = `${Settings.popupHeight}px`;
        bodyElt.style.width = `${Settings.popupWidth}px`;

        const medalsElt = document.querySelector('#medal-list');
        let c = 0;
        let x = 0;
        let y = 0;

        Rewards.forEach(({image, name}) => {
            const aElt = document.createElement('a');
            aElt.href = `https://battle.paris/medal/${name}/`;
            aElt.classList.add('medal-link', 'bouncy');
            aElt.style.left = `${x}px`;
            aElt.style.top = `${y}px`;

            const imgElt = document.createElement('img');
            imgElt.src = `https://battle.paris/static/Rewards/${image}.png`;
            imgElt.title = decodeURI(name);

            aElt.append(imgElt);
            medalsElt.append(aElt);

            x += Settings.imageSize + Settings.spacing;
            if (++c % Settings.linkPerRow === 0) {
                x = 0;
                y += Settings.imageSize + Settings.spacing;
            }
        });

        hide('#logged');
        show('#medal-list');

        // "Manual" links
        document.querySelectorAll('a.medal-link').forEach((aElt) => {
            aElt.addEventListener('click', (e) => {
                const {href: url} = aElt;
                if (e.ctrlKey) {
                    chrome.tabs.create({url});
                    return false;
                } else {
                    chrome.tabs.update({url});
                    window.close();
                }
            });
        });
    },

    checkLoggedUser: async function () {
        const tabId = await getCurrentTabId();

        chrome.scripting.executeScript({
            files: ['jquery-2.1.3.min.js', 'poi-count.js'],
            target: {tabId},
        });
    },

    updatePopup: function (e) {
        if (!e.logged) {
            // Display "not logged" message
            setText('#not-logged', chrome.i18n.getMessage('notLogged'));
            show('#not-logged');
            return;
        }

        // Display medal details
        show('#logged');
        setText('#checked-poi-label', chrome.i18n.getMessage('checkedPoi'));
        setText('#left-poi-label', chrome.i18n.getMessage(e.left > 1 ? 'leftPois' : 'leftPoi'));
        setText('#total-checked-label', chrome.i18n.getMessage('totalChecked'));
        setText('#checked-poi', e.checked);
        setText('#total-poi', e.checked + e.left);
        setText('#left-poi', e.left);
        setText('#total-checked', e.total);
        setText('#medal-name', e.name);
        document.querySelector('#picto').src = e.picto;

        // Bouncing effect on "all-medals" link
        const obj = this;

        // Handle click on link
        document.querySelector('#all-medals').addEventListener('click', () => {
            this.displayAllMedals()
        });
    }
};

const appReady = new Promise((resolve) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
    } else {
        resolve();
    }
});

const initialize = () => {
    // Listen to the injected script
    chrome.runtime.onMessage.addListener(function (e, sender) {
        battleParisEnhancer.updatePopup(e);
    });

    // Reset DIVs visibility
    hide('#not-logged', '#logged', '#medal-list');

    battleParisEnhancer.checkPage();
};

appReady.then(initialize);
