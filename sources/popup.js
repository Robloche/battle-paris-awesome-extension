const getCurrentTabId = async () => {
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    return tab?.id ?? null;
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
        $('body').width(Settings.popupWidth).height(Settings.popupHeight);

        const medalsDiv = $('#medal-list');
        let c = 0;
        let x = 0;
        let y = 0;

        $(Rewards).each(function () {
            $('<img />')
                .attr({
                    src: 'https://battle.paris/static/Rewards/' + this.image + '.png',
                    title: decodeURI(this.name)
                })
                .addClass('medal-link')
                .appendTo($('<a />').attr({
                    href: 'https://battle.paris/medal/' + this.name + '/'
                })
                    .css('left', x)
                    .css('top', y)
                    .appendTo(medalsDiv));

            x += Settings.imageSize + Settings.spacing;
            if (++c % Settings.linkPerRow === 0) {
                x = 0;
                y += Settings.imageSize + Settings.spacing;
            }
        });

        $('#logged').hide();
        medalsDiv.show();

        // Bouncing effect on medals
        $('.medal-link').hover(
            function () {
                const size = Settings.imageSize + Settings.zoom;
                $(this).stop(false, true).animate({
                    'width': size,
                    'height': size,
                    'margin': -Settings.zoom / 2
                }, {duration: 200});
            },
            function () {
                $(this).stop(false, true).animate({
                    'width': Settings.imageSize,
                    'height': Settings.imageSize,
                    'margin': 0
                }, {duration: 300});
            }
        );

        // "Manual" links
        $('body').on('click', 'a:not(#all-medals)', function (e) {
            if (e.ctrlKey) {
                chrome.tabs.create({url: $(this).attr('href')});
                return false;
            } else {
                chrome.tabs.update({url: $(this).attr('href')});
                window.close();
            }
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
            $('#not-logged').text(chrome.i18n.getMessage('notLogged')).show();
            return;
        }

        // Display medal details
        $('#logged').show();
        $('#checked-poi-label').text(chrome.i18n.getMessage('checkedPoi'));
        $('#left-poi-label').text(chrome.i18n.getMessage(e.left > 1 ? 'leftPois' : 'leftPoi'));
        $('#total-checked-label').text(chrome.i18n.getMessage('totalChecked'));
        $('#checked-poi').text(e.checked);
        $('#total-poi').text(e.checked + e.left);
        $('#left-poi').text(e.left);
        $('#total-checked').text(e.total);
        $('#picto').attr('src', e.picto);
        $('#medal-name').text(e.name);

        // Bouncing effect on "all-medals" link
        const obj = this;
        $('#all-medals img').hover(
            function () {
                const size = Settings.allMedalsSize + 6;
                $(this).stop(false, true).animate({width: size, height: size, margin: -3}, {duration: 200});
            },
            function () {
                $(this).stop(false, true).animate({
                    width: Settings.allMedalsSize,
                    height: Settings.allMedalsSize,
                    margin: 0
                }, {duration: 300});
            }
        );

        // Handle click on link
        $('#all-medals').on('click', function () {
            obj.displayAllMedals();
        });
    }
};

$(function () {
    // Listen to the injected script
    chrome.runtime.onMessage.addListener(function (e, sender) {
        battleParisEnhancer.updatePopup(e);
    });

    // Reset DIVs visibility
    $('#not-logged, #logged, #medal-list').hide();

    battleParisEnhancer.checkPage();
});
