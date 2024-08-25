var battleParisEnhancer = {

	linkPerRow: 10,
	spacing: 16,
	imageSize: 48,
	allMedalsSize: 13,
	zoom: 10,

	checkPage: function() {
		var obj = this;
		chrome.tabs.query({
			active: true,
			lastFocusedWindow: true
		}, function(tabs) {
			var url = tabs[0].url;
			if (url.indexOf('battle.paris/medal/') > -1 || url.indexOf('battleparis.com/medal/') > -1) {
				// Medal page
				obj.checkLoggedUser();
			}
			else {
				// Not a medal page: display links to all medals
				obj.displayAllMedals();
			}
		});
	},
	
	displayAllMedals: function() {
		$('body').width(624).height(488);
					
		var medalsDiv = $('#medal-list');
		var c = 0;
		var x = 0;
		var y = 0;
		var obj = this;

		$(rewards).each(function() {
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
			
			x += obj.imageSize + obj.spacing;
			if (++c % obj.linkPerRow === 0) {
				x = 0;
				y += obj.imageSize + obj.spacing;
			}
		});
		
		$('#logged').hide();
		medalsDiv.show();

		// Bouncing effect on medals
		$('.medal-link').hover(
			function() {
				var size = obj.imageSize + obj.zoom;
				$(this).stop(false,true).animate({ 'width': size, 'height': size, 'margin': -obj.zoom / 2 }, { duration: 200 });
			},
			function() {
				$(this).stop(false,true).animate({ 'width': obj.imageSize, 'height': obj.imageSize, 'margin': 0 }, { duration: 300 });    
			}
		);
		
		// "Manual" links
		$('body').on('click', 'a:not(#all-medals)', function(e) {
			if (e.ctrlKey) {
				chrome.tabs.create({ url: $(this).attr('href') });
				return false;
			}
			else {
				chrome.tabs.update({ url: $(this).attr('href') });
				window.close();
			}
		});
	},

	checkLoggedUser: function() {
		// Call the injected script
		chrome.tabs.executeScript(null, { file: 'jquery-2.1.3.min.js' }, function() {
			chrome.tabs.executeScript(null, { file: 'poi-count.js' });
		});
	},
	
	updatePopup: function(e) {	
		if (e.logged) {	
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
			var obj = this;
			$('#all-medals img').hover(
				function() {
					var size = obj.allMedalsSize + 6;
					$(this).stop(false,true).animate({ 'width': size, 'height': size, 'margin': -3 }, { duration: 200 });
				},
				function() {
					$(this).stop(false,true).animate({ 'width': obj.allMedalsSize, 'height': obj.allMedalsSize, 'margin': 0 }, { duration: 300 });    
				}
			);

			// Handle click on link
			$('#all-medals').on('click', function () {
				obj.displayAllMedals();
			});
		}
		else {
			// Display "not logged" message
			$('#not-logged').text(chrome.i18n.getMessage('notLogged')).show();
		}
	}
};

$(function() {
	// Listen to the injected script
	chrome.runtime.onMessage.addListener(function(e, sender) {
		battleParisEnhancer.updatePopup(e);
	});

	// Reset DIVs visibility
	$('#not-logged, #logged, #medal-list').hide();
	
	battleParisEnhancer.checkPage();
});
