import gsap from '/node_modules/gsap/all.js';

var customCode = {
	
    Player: function () {  
        //BEGIN CUSTOM CODE
        var hdScreen = scene.getObjectByName("screen", true);
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        
        const video = document.getElementById('video');
        video.src = "./assets/matrix.mp4";
        video.load();
        video.play();
        const videoTexture = new THREE.VideoTexture(video);
        //videoTexture.minFilter = THREE.LinearFilter;
        //videoTexture.magFilter = THREE.LinearFilter; 
        //videoTexture.format = THREE.RGBFormat;

        var videoMaterial = new THREE.MeshBasicMaterial( { 
            map: videoTexture,
            side: THREE.DoubleSide,
            overdraw: true
        } );

        let videoPlane = new THREE.PlaneGeometry(1,1);
        let videoMesh = new THREE.Mesh(videoPlane, videoMaterial);
        scene.add(videoMesh);
        videoMesh.position.set(0,0,0.2);


        window.addEventListener( 'mousemove', function(e){
            mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
        } );
        

        function moveCameraToScreen(){
            gsap.to( camera.position, { duration: 2, z: 1.5, y: 0.50, x: -0.2 } );
        }
        
        function moveScreenToCamera(){
            gsap.to( hdScreen.position, { duration: 3, z: 0.18 } );
            document.body.style.transition = "all 500ms ease-in-out";
            document.body.style.filter = "blur(0px)";
        }

        window.addEventListener( 'click', function (  ) {
            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects( scene.children );
            for(let i = 0; i < intersects.length; i++) {
                if ( intersects[ i ].object.name === 'screen' ) {
                    document.body.style.filter = "blur(2px)";
                    moveCameraToScreen();
                    setTimeout(moveScreenToCamera, 2000);
                }
            }
        });

        let oldx = 0
        let oldy = 0
        window.onmousemove = function(ev){
            let changex = ev.x - oldx;
            let changey = ev.y - oldy;
            camera.position.x += changex/7500;
            camera.position.y += changey/15000;
            oldx = ev.x;
            oldy = ev.y;
        }
    }
}