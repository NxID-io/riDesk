import gsap from '/node_modules/gsap/all.js';

var APP = {

	Player: function () {

		var renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio ); // TODO: Use player.setPixelRatio()
		renderer.outputEncoding = THREE.sRGBEncoding;

		var loader = new THREE.ObjectLoader();
		var camera, scene;

		var vrButton = VRButton.createButton( renderer ); // eslint-disable-line no-undef

		var events = {};

		var dom = document.createElement( 'div' );
		dom.appendChild( renderer.domElement );

		this.dom = dom;

		this.width = 500;
		this.height = 500;

		this.load = function ( json ) {

			var project = json.project;

			if ( project.vr !== undefined ) renderer.xr.enabled = project.vr;
			if ( project.shadows !== undefined ) renderer.shadowMap.enabled = project.shadows;
			if ( project.shadowType !== undefined ) renderer.shadowMap.type = project.shadowType;
			if ( project.toneMapping !== undefined ) renderer.toneMapping = project.toneMapping;
			if ( project.toneMappingExposure !== undefined ) renderer.toneMappingExposure = project.toneMappingExposure;
			if ( project.physicallyCorrectLights !== undefined ) renderer.physicallyCorrectLights = project.physicallyCorrectLights;

			this.setScene( loader.parse( json.scene ) );
			this.setCamera( loader.parse( json.camera ) );

			events = {
				init: [],
				start: [],
				stop: [],
				keydown: [],
				keyup: [],
				pointerdown: [],
				pointerup: [],
				pointermove: [],
				update: []
			};

			var scriptWrapParams = 'player,renderer,scene,camera';
			var scriptWrapResultObj = {};

			for ( var eventKey in events ) {

				scriptWrapParams += ',' + eventKey;
				scriptWrapResultObj[ eventKey ] = eventKey;

			}

			var scriptWrapResult = JSON.stringify( scriptWrapResultObj ).replace( /\"/g, '' );

			for ( var uuid in json.scripts ) {

				var object = scene.getObjectByProperty( 'uuid', uuid, true );

				if ( object === undefined ) {

					console.warn( 'APP.Player: Script without object.', uuid );
					continue;

				}

				var scripts = json.scripts[ uuid ];

				for ( var i = 0; i < scripts.length; i ++ ) {

					var script = scripts[ i ];

					var functions = ( new Function( scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';' ).bind( object ) )( this, renderer, scene, camera );

					for ( var name in functions ) {

						if ( functions[ name ] === undefined ) continue;

						if ( events[ name ] === undefined ) {

							console.warn( 'APP.Player: Event type not supported (', name, ')' );
							continue;

						}

						events[ name ].push( functions[ name ].bind( object ) );

					}

				}

			}
			//START CUSTOM CODE
			var hdScreen = scene.getObjectByName("screen", true);
			var hdCups = scene.getObjectByName("cups", true);
			var raycaster = new THREE.Raycaster();
			var mouse = new THREE.Vector2();
			camera = scene.getObjectByName("mainCamera", true);

			hdCups.material.opacity = 0;
			hdScreen.material.opacity = 0;


			/*
			const video = document.getElementById('video');
			video.src = "./assets/matrix.mp4";
			video.load();
			video.play();

			const videoTexture = new THREE.VideoTexture(video);
			videoTexture.minFilter = THREE.LinearFilter;
			videoTexture.magFilter = THREE.LinearFilter; 
			videoTexture.format = THREE.RGBFormat;

			var videoMaterial = new THREE.MeshBasicMaterial( { 
				map: videoTexture,
				side: THREE.DoubleSide,
				overdraw: true
			} );

			let videoPlane = new THREE.PlaneGeometry(0.72,0.57);
			let videoMesh = new THREE.Mesh(videoPlane, videoMaterial);
			scene.add(videoMesh);
			videoMesh.position.set(-0.172,0.22,0.2);
			*/

			window.addEventListener( 'mousemove', function(e){
				mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
				mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
			} );

			let cameraAtScreen = false;
			let cameraAtCups = false;
			//Blur background
			const blurredBGImg = new THREE.TextureLoader().load( './assets/blur.jpg' );
			const blurredMat = new THREE.MeshBasicMaterial( { map: blurredBGImg } );
			const blurredBG = new THREE.Mesh( new THREE.PlaneGeometry( 64, 46 ), blurredMat );
			blurredBG.material.map.encoding = THREE.sRGBEncoding;
			scene.add( blurredBG );
			blurredBG.material.transparent = true;
			blurredBG.material.opacity = 0;
			//Blur background end
			function moveCameraToScreen(){
				gsap.to( camera.position, { duration: 2.2, z: 12, y: 1.4, x: -0.1, ease: "power3.out" } );
				gsap.to( hdScreen.material, { duration: 2.0, opacity:1 });
				gsap.to ( blurredBG.material, { duration: 1.0, opacity:1 })
				gsap.to ( blurredBG.position, { duration: 1, z:3 })
			}
			function moveCameraToCups(){
				gsap.to( camera.position, { duration: 1.6, z: 12, y: -5.4, x: -17, ease: "power1.out" } );
				gsap.to( hdCups.material, { duration: 1.5, opacity:1 });
				gsap.to ( blurredBG.material, { duration: 1, opacity:1 })
				gsap.to ( blurredBG.position, { duration: 1, z:2 })
			}
			function createBlur(){
				//gsap.to( hdScreen.position, { duration: 0, z: 0.18 } );
				document.body.style.filter = "blur(0px)";
				document.body.style.transition = "all 0.8s linear";
			}

			window.addEventListener( 'click', function (  ) {
				raycaster.setFromCamera(mouse, camera);
				var intersects = raycaster.intersectObjects( scene.children );
				for(let i = 0; i < intersects.length; i++) {
					if ( intersects[ i ].object.name === 'screen' && cameraAtScreen === false ) {
						cameraAtScreen = true;
						document.body.style.filter = "blur(8.0px)";
						moveCameraToScreen();
						setTimeout(createBlur, 800);
					}
					if( intersects[i].object.name === 'cups' && cameraAtCups === false){
						cameraAtCups = true;
						document.body.style.filter = "blur(8.0px)";
						moveCameraToCups();
						setTimeout(createBlur, 800);
					}
				}
			});
			//move camera to origal position on pressing escape
			window.addEventListener( 'keydown', function (e) {	
				if ( e.key === "Escape" ) {
					cameraAtScreen = false;
					cameraAtCups = false;
					gsap.to( camera.position, { duration: 1.6, z: 32, y: 1, x: 0, ease: "power1.in" } );
					gsap.to( hdScreen.material, { duration: 1.5, opacity:0 });
					gsap.to( hdCups.material, { duration: 1.5, opacity:0 });
					gsap.to ( blurredBG.material, { duration: 1, opacity:0 })
					gsap.to ( blurredBG.position, { duration: 1, z:3 })
				}
			});
			
			let oldx = 0
			let oldy = 0
			/*
			window.onmousemove = function(ev){
				let changex = ev.x - oldx;
				let changey = ev.y - oldy;
				camera.position.x += changex/30000;
				camera.position.y -= changey/50000;
				oldx = ev.x;
				oldy = ev.y;
			}		
			*/
			//END CUSTOM CODE
			dispatch( events.init, arguments );

		};

		this.setCamera = function ( value ) {

			camera = value;
			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();

		};

		this.setScene = function ( value ) {

			scene = value;

		};

		this.setPixelRatio = function ( pixelRatio ) {

			renderer.setPixelRatio( pixelRatio );

		};

		this.setSize = function ( width, height ) {

			this.width = width;
			this.height = height;

			if ( camera ) {

				camera.aspect = this.width / this.height;
				camera.updateProjectionMatrix();

			}

			renderer.setSize( width, height );

		};

		function dispatch( array, event ) {

			for ( var i = 0, l = array.length; i < l; i ++ ) {

				array[ i ]( event );

			}

		}

		var time, startTime, prevTime;

		function animate() {

			time = performance.now();

			try {

				dispatch( events.update, { time: time - startTime, delta: time - prevTime } );

			} catch ( e ) {

				console.error( ( e.message || e ), ( e.stack || '' ) );

			}

			renderer.render( scene, camera );

			prevTime = time;

		}

		this.play = function () {

			if ( renderer.xr.enabled ) dom.append( vrButton );

			startTime = prevTime = performance.now();

			document.addEventListener( 'keydown', onKeyDown );
			document.addEventListener( 'keyup', onKeyUp );
			document.addEventListener( 'pointerdown', onPointerDown );
			document.addEventListener( 'pointerup', onPointerUp );
			document.addEventListener( 'pointermove', onPointerMove );

			dispatch( events.start, arguments );

			renderer.setAnimationLoop( animate );

		};

		this.stop = function () {

			if ( renderer.xr.enabled ) vrButton.remove();

			document.removeEventListener( 'keydown', onKeyDown );
			document.removeEventListener( 'keyup', onKeyUp );
			document.removeEventListener( 'pointerdown', onPointerDown );
			document.removeEventListener( 'pointerup', onPointerUp );
			document.removeEventListener( 'pointermove', onPointerMove );

			dispatch( events.stop, arguments );

			renderer.setAnimationLoop( null );

		};

		this.render = function ( time ) {

			dispatch( events.update, { time: time * 1000, delta: 0 /* TODO */ } );

			renderer.render( scene, camera );

		};

		this.dispose = function () {

			renderer.dispose();

			camera = undefined;
			scene = undefined;

		};

		//

		function onKeyDown( event ) {

			dispatch( events.keydown, event );

		}

		function onKeyUp( event ) {

			dispatch( events.keyup, event );

		}

		function onPointerDown( event ) {

			dispatch( events.pointerdown, event );

		}

		function onPointerUp( event ) {

			dispatch( events.pointerup, event );

		}

		function onPointerMove( event ) {

			dispatch( events.pointermove, event );

		}

	}

};

export { APP };
