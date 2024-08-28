const msg = {
    logged: $('#login').length === 0,
    name: '',
    picto: null,
    total: 0,
    checked: 0,
    left: 0
};

const sortUnorderedList = (ul) => {
    const lis = ul.children();
    const vals = [];

    // Get all POIs
    for (let i = 0, l = lis.length; i < l; ++i) {
        const item = $(lis[i].innerHTML);

        vals.push({
            counter: parseInt(item.find('.place_counter').first().text(), 10),
            text: item.find('.txt').first().text(),
            innerHTML: lis[i].innerHTML
        });
    }

    // Sort POIs
    vals.sort((a, b) => {
        if (a.counter !== b.counter) {
            if (a.counter > 0 && b.counter > 0) {
                return b.counter - a.counter;
            } else {
                return a.counter - b.counter;
            }
        } else {
            return a.text.localeCompare(b.text);
        }
    });

    // Display ordered POIs
    for (let i = 0, l = lis.length; i < l; ++i) {
        lis[i].innerHTML = vals[i].innerHTML;
    }
}

if (msg.logged) {
    // User logged in

    // Sort POIs
    sortUnorderedList($('.list.box').first().parent());

    // Unhighlight checked POIs
    $('.place_counter').each(function () {
        const c = parseInt($(this).text(), 10);
        msg.total += c;
        if (c === 0) {
            msg.left++;
        } else {
            $(this).parents('.list.box')
                .css('background-color', '#c7c7c7')
                .css('box-shadow', 'none');
            msg.checked++;
        }
    });

    msg.name = $('.menupad > .t6').first().text();

    msg.picto = 'https://battle.paris' + $('.medal_big > img').attr('src');
}

chrome.runtime.sendMessage(msg);
