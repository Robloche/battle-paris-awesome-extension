const msg = {
    logged: document.querySelector('#login') === null,
    name: '',
    picto: null,
    total: 0,
    checked: 0,
    left: 0
};

const comparePois = (a, b) => {
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

const sortUnorderedList = (liElements) => {
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
    vals.sort(comparePois);

    // Display ordered POIs
    for (let i = 0, l = liElements.length; i < l; ++i) {
        liElements[i].innerHTML = vals[i].innerHTML;
    }
}

if (msg.logged) {
    // User logged in

    // Sort POIs
    sortUnorderedList(document.querySelectorAll('.list.box'));

    // Unhighlight checked POIs
    document.querySelectorAll('.place_counter').forEach((elt) => {
        const c = parseInt(elt.innerText, 10);
        msg.total += c;
        if (c === 0) {
            msg.left++;
        } else {
            const liParent = elt.closest('.list.box');
            if (liParent) {
                liParent.style.backgroundColor = '#c7c7c7';
                liParent.style.boxShadow = 'none';
            }
            msg.checked++;
        }
    });

    msg.name = document.querySelector('.menupad > .t6').innerText;
    const {src} = document.querySelector('.medal_big > img');
    msg.picto = `${src.startsWith('/') ? 'https://battle.paris' : ''}${src}`;
}

chrome.runtime.sendMessage(msg);
