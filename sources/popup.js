const Settings = Object.freeze({
    popupHeight: 488,
    popupWidth: 624,
});

class BattleParisEnhancer {

    async checkPage() {
        const tab = await getCurrentTab();
        if (!tab) {
            return;
        }

        const {url} = tab;

        if (url.indexOf('battle.paris/medal/') > -1 || url.indexOf('battleparis.com/medal/') > -1) {
            // Medal page
            await this.runContentScript();
        } else {
            // Not a medal page: display links to each and every medal
            this.displayAllMedals();
        }
    }

    displayAllMedals() {
        const bodyElt = document.querySelector('body');
        bodyElt.style.height = `${Settings.popupHeight}px`;
        bodyElt.style.width = `${Settings.popupWidth}px`;

        const medalsElt = document.querySelector('#medal-list');

        Rewards.forEach(({image, name}) => {
            const aElt = document.createElement('a');
            aElt.href = `https://battle.paris/medal/${name}/`;
            aElt.classList.add('medal-link', 'bouncy');

            const imgElt = document.createElement('img');
            imgElt.src = `https://battle.paris/static/Rewards/${image}.png`;
            imgElt.title = decodeURI(name);

            aElt.append(imgElt);
            medalsElt.append(aElt);
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
    }

    async runContentScriptInternal(tabId) {
        this.updatePopup(await chrome.tabs.sendMessage(tabId, {type: 'process'}));
    }

    async runContentScript() {
        const tab = await getCurrentTab();
        if (!tab) {
            return;
        }

        const {id: tabId} = tab;

        try {
            await this.runContentScriptInternal(tabId);
        } catch (error) {
            // No response: content script not loaded yet
            await chrome.scripting.executeScript({
                files: ['poi-count.js'],
                target: {tabId},
            });

            await this.runContentScriptInternal(tabId);
        }
    }

    updatePopup(e) {
        if (!e) {
            // No response: something bad happened
            return;
        }

        const {checked, left, logged, name, picto, status, total} = e;

        if (status === 'not_logged') {
            // Display "not logged" message
            setText('#not-logged', chrome.i18n.getMessage('notLogged'));
            show('#not-logged');
            return;
        }

        if (status !== 'processed') {
            // Unexpected status
            console.error(`Error: unexpected status "${status}"`);
            return;
        }

        // Display medal details
        show('#logged');
        setText('#checked-poi-label', chrome.i18n.getMessage('checkedPoi'));
        setText('#left-poi-label', chrome.i18n.getMessage(left > 1 ? 'leftPois' : 'leftPoi'));
        setText('#total-checked-label', chrome.i18n.getMessage('totalChecked'));
        setText('#checked-poi', checked);
        setText('#total-poi', checked + left);
        setText('#left-poi', left);
        setText('#total-checked', total);
        setText('#medal-name', name);
        document.querySelector('#picto').src = picto;

        // Handle click on link
        document.querySelector('#all-medals').addEventListener('click', () => {
            console.log(`all medals link clicked`);
            this.displayAllMedals()
        });
    }
}

const initialize = async () => {
    const btp = new BattleParisEnhancer();

    // Listen to the injected script
    chrome.runtime.onMessage.addListener((e) => btp.updatePopup(e));

    // Reset DIVs visibility
    //hide('#not-logged', '#logged', '#medal-list');

    await btp.checkPage();
};

appReady.then(initialize);
