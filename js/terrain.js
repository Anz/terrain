
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
	
	// load shaders
	program = load_shader('program/vertex.glsl', 'program/fragment.glsl');
	
	// load textures
	diffuse_grass = load_texture('img/grass_diffuse.png');
	heightmap = load_texture('img/heightmap.png');
	whiteMap = createTexture([255,255,255,255],1,1);
	
	// render settings
	renderSettings = new RenderSettings();
	normalRenderSettings = new RenderSettings();
	normalRenderSettings.useLight = false;
	
	// light
	light = new Light();
	light.color = [1.0, 0.8, 0.8];
	vec3.normalize([-0.2, -25.0, 0.0], light.direction);
	vec3.scale(light.direction, -1);
	
	// material
	terrainMaterial = new Material([0.0, 0.0, 0.0], [0.3, 0.3, 0.3, 1.0], diffuse_grass, heightmap);
	normalMaterial = new Material([0.0, 0.0, 0.0], [0.5, 0.0, 0.0, 1.0], whiteMap, heightmap);
	
	// create terrain
	terrain = createTerrain(128, 2, 128);
	
	// setup projection matrix
	projectionMatrix = mat4.create();
	mat4.perspective(45, canvas.width/canvas.height, 0.001, 100000.0, projectionMatrix);
	
	// setup view matrix
	viewMatrix = mat4.create();
	
	// setup model matrix
	modelMatrix = mat4.create();
	
	// camera
	camera = {x: 0.0, y: 1.0, z: 3.0, zoom: 1.0};
	
	// terrain
	model = {x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1.0, sy: 1.0, sz: 1.0};
	
	// keyboard
	keys = new Object();
}

function update() {

	requestAnimationFrame(update);
	
	// navigation
	if (keys[65]) camera.x -= 10.0;
	if (keys[68]) camera.x += 10.0;
	if (keys[83]) camera.y -= 10.0;
	if (keys[87]) camera.y += 10.0;
	

	// clear buffer
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	
	// depth buffer
	if ($('#depthbuffer').attr('checked')) {
		gl.enable(gl.DEPTH_TEST);
	} else {
		gl.disable(gl.DEPTH_TEST);
	}
	
	// render
	renderSettings.useLight = typeof($('#lighting').attr('checked')) != 'undefined';
	renderSettings.useDiffuseMap = typeof($('#diffuseMap').attr('checked')) != 'undefined';
	renderSettings.useHeightMap = typeof($('#heightMap').attr('checked')) != 'undefined';
	
	drawMesh(program, terrain, terrainMaterial, renderSettings, light);
	if ($('#vertexNormals').attr('checked')) {
		if (!terrain.normalMesh) {
			terrain.normalMesh = createNormalMesh(terrain);
		}
	
		drawMesh(program, terrain.normalMesh, normalMaterial, normalRenderSettings, light);
	}
	
	if ($('#faceNormals').attr('checked')) {
		if (!terrain.faceNormalMesh) {
			terrain.faceNormalMesh = createFaceNormalMesh(terrain);
		}
	
		drawMesh(program, terrain.faceNormalMesh, normalMaterial, normalRenderSettings, light);
	}
}

var f = 0.0;

function createTerrain(width, height, depth) {
	var mesh = createMesh(gl.TRIANGLES, width*height*depth, (2*(width-1)*(height-1)+2*(width-1)*(depth-1)+2*(height-1)*(depth-1))*2); 
	
	// vertices
	var index = 0;
	
	for (var z = 0; z < depth; z++) {
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				// position
				mesh.vertices[index++] = x - (width-1)/2;
				mesh.vertices[index++] = y - (height-1)/2;
				mesh.vertices[index++] = z - (depth-1)/2;
				
				// normal
				if (x <= 0) {
					mesh.vertices[index++] = -1.0;
					mesh.vertices[index++] = 0.0;
					mesh.vertices[index++] = 0.0;
				} else if (x >= width-1) {
					mesh.vertices[index++] = 1.0;
					mesh.vertices[index++] = 0.0;
					mesh.vertices[index++] = 0.0;
				} else if (z <= 0) {
					mesh.vertices[index++] = 0.0;
					mesh.vertices[index++] = 0.0;
					mesh.vertices[index++] = -1.0;
				} else if (z >= depth-1) {
					mesh.vertices[index++] = 0.0;
					mesh.vertices[index++] = 0.0;
					mesh.vertices[index++] = 1.0;
				} else if (y <= 0) {
					mesh.vertices[index++] = 0.0;
					mesh.vertices[index++] = -1.0;
					mesh.vertices[index++] = -1.0;
				} else if (y >= height-1) {
					mesh.vertices[index++] = 0.0;
					mesh.vertices[index++] = 1.0;
					mesh.vertices[index++] = 0.0;
				}  else {
					mesh.vertices[index++] = 0.0;
					mesh.vertices[index++] = 0.0;
					mesh.vertices[index++] = 0.0;
				}
				
				// texture coordinates
				mesh.vertices[index++] = 1.0/depth*z;
				mesh.vertices[index++] = 1.0/width*x;
			}
		}
	}
	
	// indices
	var index = 0;
	
	function mapping_faces(x, y, linex, liney, offset1,  offset2,  offset3,  offset4, flip) {
		function vertex(v) {
			return v[0] + v[1]*width + v[2]*width*height;
		}
	
		var cursor = vec3.create();
	
		for (var i=0; i<liney-1; i++) {
			vec3.scale(y, i, cursor);
		
			for (var j=0; j<linex-1; j++) {
				var v1 = vec3.create();
				var v2 = vec3.create();
				var v3 = vec3.create();
				var v4 = vec3.create();
				
				vec3.add(cursor, offset1, v1);
				vec3.add(cursor, offset2, v2);
				vec3.add(cursor, offset3, v3);
				vec3.add(cursor, offset4, v4);
				
				if (!flip) {
					mesh.indices[index++] = vertex(v1);
					mesh.indices[index++] = vertex(v2);
					mesh.indices[index++] = vertex(v3);
					mesh.indices[index++] = vertex(v2);
					mesh.indices[index++] = vertex(v4);
					mesh.indices[index++] = vertex(v3);
				} else {
					mesh.indices[index++] = vertex(v1);
					mesh.indices[index++] = vertex(v3);
					mesh.indices[index++] = vertex(v2);					
					mesh.indices[index++] = vertex(v2);
					mesh.indices[index++] = vertex(v3);
					mesh.indices[index++] = vertex(v4);							
				}
				
				vec3.add(cursor, x);
			}
		}
	}
	
	// front
	mapping_faces([1,0,0], [0,1,0], width, height, [0,0,0], [1,0,0], [0,1,0], [1,1,0], false);
	// back
	mapping_faces([1,0,0], [0,1,0], width, height, [0,0,depth-1], [1,0,depth-1], [0,1,depth-1], [1,1,depth-1], true);
	// left
	mapping_faces([0,1,0], [0,0,1], height, depth, [0,0,0], [0,1,0], [0,0,1], [0,1,1], false);
	// right
	mapping_faces([0,1,0], [0,0,1], height, depth, [width-1,0,0], [width-1,1,0], [width-1,0,1], [width-1,1,1], true);
	// bottom
	mapping_faces([1,0,0], [0,0,1], width, depth, [0,0,0], [1,0,0], [0,0,1], [1,0,1], true);	
	// top
	mapping_faces([1,0,0], [0,0,1], width, depth, [0,height-1,0], [1,height-1,0], [0,height-1,1], [1,height-1,1], false);	
	
	mesh.init();
	
	return mesh;
}



// keydown event
$(window).keydown(function(event) {
	keys[event.which] = true;
	console.log(event.which);
});

// keyup event
$(window).keyup(function(event) {
	keys[event.which] = false;
});

// mouse wheel
/*$(document).bind('mousewheel', function(event, delta) {
	//camera.zoom += delta*0.0001;
	var v = event.wheelDelta ? -event.wheelDelta/200 : event.detail/10;
	console.log(event);
});*/

window.onmousewheel = function(e) {
	camera.z += e.wheelDelta ? e.wheelDelta : -e.detail;
	//camera.z = Math.max(0, camera.z);
};


// init event
$(document).ready(function() {
	canvas = document.getElementById('canvas');
	editor_init();
	requestAnimationFrame(update);
});

// window resize events
$(window).resize(function() {
	editor_init();
});