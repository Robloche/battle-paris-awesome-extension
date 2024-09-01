class PoiCount {

    static initialize() {
        chrome.runtime.onMessage.addListener((e, sender, sendResponse) => {
            if (!e) {
                // No response: something bad happened
                return;
            }

            const {type} = e;

            if (type === 'loaded_check') {
                sendResponse({status: 'loaded'});
            } else if (type === 'process') {
                PoiCount.process();
            }
        });
    }

    static comparePois(a, b) {
        if (a.counter !== b.counter) {
            if (a.counter > 0 && b.counter > 0) {
                return b.counter - a.counter;
            } else {
                return a.counter - b.counter;
            }
        } else {
            return a.text.localeCompare(b.text);
        }
    };

    static sortUnorderedList(liElements) {
        const vals = [];

        // Get all POIs
        for (let i = 0, l = liElements.length; i < l; ++i) {
            const elt = liElements[i];
            const counter = parseInt(elt.querySelector('.place_counter').innerText, 10);
            const text = elt.querySelector('.txt').innerText;
            const {innerHTML} = elt;
            vals.push({counter, text, innerHTML});
        }

        // Sort POIs
        vals.sort(PoiCount.comparePois);

        // Display ordered POIs
        for (let i = 0, l = liElements.length; i < l; ++i) {
            liElements[i].innerHTML = vals[i].innerHTML;
        }
    }

    static process() {
        if (document.querySelector('#login') !== null) {
            // Not logged
            chrome.runtime.sendMessage({status: 'not_logged'});
            return;
        }

        // User logged in

        // Sort POIs
        PoiCount.sortUnorderedList(document.querySelectorAll('.list.box'));

        // Unhighlight checked POIs
        let total = 0;
        let left = 0;
        let checked = 0;

        document.querySelectorAll('.place_counter').forEach((elt) => {
            const c = parseInt(elt.innerText, 10);
            total += c;
            if (c === 0) {
                ++left;
            } else {
                const liParent = elt.closest('.list.box');
                if (liParent) {
                    liParent.style.backgroundColor = '#c7c7c7';
                    liParent.style.boxShadow = 'none';
                }
                ++checked;
            }
        });

        const name = document.querySelector('.menupad > .t6').innerText;
        const {src} = document.querySelector('.medal_big > img');
        const picto = `${src.startsWith('/') ? 'https://battle.paris' : ''}${src}`;
        const status = 'processed';

        chrome.runtime.sendMessage({checked, left, name, picto, status, total});
    }
}

PoiCount.initialize();
