
// browser compatibility
var requestAnimationFrame = typeof(mozRequestAnimationFrame) != 'undefined' ? mozRequestAnimationFrame : webkitRequestAnimationFrame;

function editor_init() {
	// resize canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight - 40;

	// initialize webgl
	gl = canvas.getContext('experimental-webgl');
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	
	gl.frontFace(gl.CW);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
	gl.lineWidth(2.0);
	
	// webgl init
	renderer = new Renderer();
	
	var resources = [
		new Resource(renderer.TEXTURE, 'diffuse', 'img/diffuse.png'),
		new Resource(renderer.TEXTURE, 'heightmap', 'img/heightmap.png'),
		new Resource(renderer.SHADER, 'standard', 'program/default.glsl')
	];
	
	renderer.loadResources(resources, function() {
		
		// load shaders
		program = renderer.shaders.standard;
		
		// load textures
		diffuse_grass = renderer.textures.diffuse;
		heightmap = renderer.textures.heightmap;
		//ligthFrameBuffer = gl.newFBO(diffuse_grass);
		
		whiteMap = renderer.newTexture(new Uint8Array([255,255,255,255]), 1, 1, gl.NEAREST, gl.NEAREST);
		
		// render settings
		renderSettings = new RenderSettings();
		
		// light
		light = new Light();
		light.color = [0.8, 0.8, 0.8];
		light.direction = [-0.25, -25.0, -1.0];
		vec3.scale(light.direction, -1);
		
		// material
		terrainMaterial = new Material([0.2, 0.2, 0.2], 1.0, diffuse_grass, heightmap);
		terrainMaterial.useHeightMap = true;
		
		// create terrain
		//terrain = createTerrain2(128, 2, 128);
		terrain = createTerrain(128, 128);
		
		// setup projection matrix
		projectionMatrix = mat4.create();
		mat4.perspective(45, canvas.width/canvas.height, 0.01, 10000.0, projectionMatrix);
		
		// setup view matrix
		viewMatrix = mat4.create();
		
		// setup model matrix
		modelMatrix = mat4.create();
		
		// camera
		camera = {x: 0.0, y: 100.0, z: -5000.0, zoom: 1.0};
		
		// terrain
		model = {x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 10.0, sy: 10.0, sz: 10.0};
		
		// keyboard
		keys = new Object();
		
		//model.ry = Math.PI/4;
		
		// framebuffer
		//ligthFrameBuffer = glFrameBuffer(heightmap);
		
		initListeners();
		update();
	});
}

function update() {
	model.ry += 0.01;

	requestAnimationFrame(update);
	
	// navigation
	if (keys[65]) camera.x -= 10.0;
	if (keys[68]) camera.x += 10.0;
	if (keys[83]) camera.y -= 10.0;
	if (keys[87]) camera.y += 10.0;
	
	// render ligth
	/*glSetFBO(ligthFrameBuffer);
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	drawMesh(program, terrain, terrainMaterial, renderSettings, light);
	glSetFBO(null);
	*/

	// clear buffer
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
		
	drawMesh(program, terrain, terrainMaterial, renderSettings, light);
	/*drawMesh(program, terrain.frontMesh, terrainMaterial, renderSettings, light);
	drawMesh(program, terrain.backMesh, terrainMaterial, renderSettings, light);
	drawMesh(program, terrain.leftMesh, terrainMaterial, renderSettings, light);
	drawMesh(program, terrain.rightMesh, terrainMaterial, renderSettings, light);
	drawMesh(program, terrain.topMesh, terrainMaterial, renderSettings, light);
	drawMesh(program, terrain.bottomMesh, terrainMaterial, renderSettings, light);*/
}

function createTerrain(width, height) {
	var mesh = createMesh(gl.TRIANGLES, width*height, 2*(width-1)*(height-1));
	
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			var vertex = (y*height+x);
		
			var vertexIndex = vertex*5;
			mesh.vertices[vertexIndex+0] = x-width/2.0;
			mesh.vertices[vertexIndex+1] = 0;
			mesh.vertices[vertexIndex+2] = y-height/2.0;
			mesh.vertices[vertexIndex+3] = 1.0/width*x;
			mesh.vertices[vertexIndex+4] = 1.0/height*y;
			
			if (y > 0 && x > 0) {
				var index = ((y-1)*height+x-1)*6;
			
				mesh.indices[index+0] = vertex-height;
				mesh.indices[index+1] = mesh.indices[index+0]-1;
				mesh.indices[index+2] = vertex-1;
				
				mesh.indices[index+3] = mesh.indices[index+0];
				mesh.indices[index+4] = vertex-1;
				mesh.indices[index+5] = vertex;
			}
		}
	}
	
	mesh.init();
	
	return mesh;
}

function initListeners() {

	// keydown event
	$(window).keydown(function(event) {
		keys[event.which] = true;
	});

	// keyup event
	$(window).keyup(function(event) {
		keys[event.which] = false;
	});

	// mouse wheel
	$('#canvas').bind('mousewheel', function(event) {
		camera.z += event.originalEvent.wheelDelta;
	});

	$('#canvas').bind('DOMMouseScroll', function(event) {
		camera.z += -event.originalEvent.detail*100;
	});

	// window resize events
	$(window).resize(function() {
		editor_init();
	});

	// lighting event listener
	$('input[name=lighting]').change(function() {
	  renderSettings.lighting = $(this).val();
	});

	// texture mapping event listener
	$('input[name=mapping]').change(function() {
	  renderSettings.textureMapping = $(this).val();
	});

	// shininess event listener
	$('input[name=shininess]').change(function() {
	  terrainMaterial.shininess = $(this).val();
	});

	depthbuffer = true;

	// depthbuffer event listener
	$('#depthbuffer').change(function() {
	  depthbuffer = !depthbuffer;
		if (depthbuffer) {
			gl.enable(gl.DEPTH_TEST);
		} else {
			gl.disable(gl.DEPTH_TEST);
		}
	});
}

// init event
$(document).ready(function() {
	canvas = document.getElementById('canvas');
	editor_init();
});