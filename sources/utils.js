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
        elt.classList.add('hidden');
    });
};

const setText = (elementSelector, text) => {
    document.querySelector(elementSelector).innerHTML = text;
};

const appReady = new Promise((resolve) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
    } else {
        resolve();
    }
});
