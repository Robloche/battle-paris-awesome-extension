const Settings = Object.freeze({
    imageSize: 48,
    linkPerRow: 10,
    popupHeight: 488,
    popupWidth: 624,
    spacing: 16,
});

class BattleParisEnhancer {

    checkPage() {
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
    }

    displayAllMedals() {
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
    }

    async checkLoggedUser() {
        const tabId = await getCurrentTabId();

        chrome.scripting.executeScript({
            files: ['poi-count.js'],
            target: {tabId},
        });
    }

    updatePopup(e) {
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
}

const initialize = () => {
    const btp = new BattleParisEnhancer();

    // Listen to the injected script
    chrome.runtime.onMessage.addListener((e) => btp.updatePopup(e));

    // Reset DIVs visibility
    hide('#not-logged', '#logged', '#medal-list');

    btp.checkPage();
};

appReady.then(initialize);
