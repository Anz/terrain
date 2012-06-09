
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
	diffuse_grass = load_texture('img/diffuse.png');
	heightmap = load_texture('img/heightmap.png');
	whiteMap = createTexture([255,255,255,255],1,1);
	
	// render settings
	renderSettings = new RenderSettings();
	normalRenderSettings = new RenderSettings();
	normalRenderSettings.useLight = false;
	
	// light
	light = new Light();
	light.color = [0.8, 0.8, 0.8];
	light.direction = [-0.25, -25.0, -1.0];
	vec3.scale(light.direction, -1);
	
	// material
	terrainMaterial = new Material([0.2, 0.2, 0.2], [0.3, 0.3, 0.3, 1.0], diffuse_grass, heightmap);
	
	// create terrain
	terrain = createTerrain2(128, 2, 128);
	
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
	
	// elements
	elementDepthBuffer = $('#depthbuffer');
	elementLighting = $('#lighting');
	elementHeightMap = $('#heightMap');
}

function update() {
	f += 0.001;

	requestAnimationFrame(update);
	
	// navigation
	if (keys[65]) camera.x -= 10.0;
	if (keys[68]) camera.x += 10.0;
	if (keys[83]) camera.y -= 10.0;
	if (keys[87]) camera.y += 10.0;
	

	// clear buffer
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	
	// depth buffer
	if (true || elementDepthBuffer.attr('checked')) {
		gl.enable(gl.DEPTH_TEST);
	} else {
		gl.disable(gl.DEPTH_TEST);
	}
	
	// render
	renderSettings.lighting = $('input[name=lighting]:checked').val();
	renderSettings.textureMapping = $('input[name=mapping]:checked').val();
	
	drawMesh(program, terrain.frontMesh, terrainMaterial, renderSettings, light);
	drawMesh(program, terrain.backMesh, terrainMaterial, renderSettings, light);
	drawMesh(program, terrain.leftMesh, terrainMaterial, renderSettings, light);
	drawMesh(program, terrain.rightMesh, terrainMaterial, renderSettings, light);
	drawMesh(program, terrain.topMesh, terrainMaterial, renderSettings, light);
	drawMesh(program, terrain.bottomMesh, terrainMaterial, renderSettings, light);
}

var f = 0.0;

function createTerrain2(width, height, depth) {	
	var frontMesh = createMesh(gl.TRIANGLES, width*height, 2*2*(width-1)*(height-1));
	var backMesh = createMesh(gl.TRIANGLES, width*height, 2*2*(width-1)*(height-1));
	
	var leftMesh = createMesh(gl.TRIANGLES, depth*height, 2*2*(depth-1)*(height-1));
	var rightMesh = createMesh(gl.TRIANGLES, depth*height, 2*2*(depth-1)*(height-1));
	
	var topMesh = createMesh(gl.TRIANGLES, depth*width, 2*2*(depth-1)*(width-1));
	var bottomMesh = createMesh(gl.TRIANGLES, depth*width, 2*2*(depth-1)*(width-1));

	function vertex(mesh, index, position, normal, textureCoord) {
		// position
		mesh.vertices[index+0] = position[0];
		mesh.vertices[index+1] = position[1];
		mesh.vertices[index+2] = position[2];
		
		// texture coordinates
		mesh.vertices[index+3] = textureCoord[0];
		mesh.vertices[index+4] = textureCoord[1];
	}
	
	function index(mesh, index, v1, v2, v3) {
		// position
		mesh.indices[index+0] = v1;
		mesh.indices[index+1] = v2;
		mesh.indices[index+2] = v3;
	}
	
	var frontNormal = [0.0, 0.0, -1.0];
	
	var backVertexStart = width*height*5;
	var backIndexStart = (width-1)*(height-1)*6;
	var backNormal = [0.0, 0.0, 1.0];
	
	var leftVertexStart = 2*width*height*5;
	var leftIndexStart = 2*(width-1)*(height-1)*6;
	var leftNormal = [-1.0, 0.0, 0.0];
	
	var rightVertexStart = 2*width*height*5 + depth*height*5;
	var rightIndexStart = 2*(width-1)*(height-1)*6 + (depth-1)*(height-1)*6;
	var rightNormal = [1.0, 0.0, 0.0];
	
	var topVertexStart = 2*width*height*5 + 2*depth*height*5;
	var topIndexStart = 2*(width-1)*(height-1)*6 + 2*(height-1)*(depth-1)*6;
	var topNormal = [0.0, 1.0, 0.0];
	
	var bottomVertexStart = 2*width*height*5 + 2*depth*height*5 + width*depth*5;
	var bottomIndexStart = 2*(width-1)*(height-1)*6 + 2*(depth-1)*(height-1)*6 + (width-1)*(depth-1)*6;
	var bottomNormal = [0.0, -1.0, 0.0];

	var max = Math.max(depth, Math.max(width, height));

	for (var i=0; i<max; i++) {
		for (var j=0; j<max; j++) {		
			// front
			if (i < height && j < width) {
				var offset = i*width + j;
			
				vertex(frontMesh, 5*offset, [j-(width-1)/2.0, i-(height-1)/2.0, -(depth-1)/2.0], frontNormal, [1.0/width*j, 0.0]);
				
				if (i > 0 && j > 0) {
					var lastLine = offset - width;
					index(frontMesh, 6*offset, lastLine, lastLine - 1, offset - 1);
					index(frontMesh, 6*offset+3, lastLine, offset - 1, offset);
				}
			}
			
			// back
			if (i < height && j < width) {
				var offset = i*width + j;
			
				vertex(backMesh, 5*offset, [j-(width-1)/2.0, i-(height-1)/2.0, (depth-1)/2.0], backNormal, [1.0*width*j, 1.0]);
				
				if (i > 0 && j > 0) {
					var lastLine = offset - width;
					index(backMesh, 6*offset, lastLine, offset - 1, lastLine - 1);
					index(backMesh, 6*offset+3, lastLine, offset, offset - 1);
				}
			}
			
			// left
			if (i < height && j < depth) {
				var offset = i*depth + j;
			
				vertex(leftMesh, 5*offset, [-(width-1)/2.0, i-(height-1)/2.0, j-(depth-1)/2.0], leftNormal, [0.0, 1.0/depth*j]);
				
				if (i > 0 && j > 0) {
					var lastLine = offset - depth;
					index(leftMesh, 6*offset, lastLine, offset - 1, lastLine - 1);
					index(leftMesh, 6*offset+3, lastLine, offset, offset - 1);
				}
			}
			
			// right
			if (i < height && j < depth) {
				var offset = i*depth + j;
			
				vertex(rightMesh, 5*offset, [(width-1)/2.0, i-(height-1)/2.0, j-(depth-1)/2.0], rightNormal, [1.0, 1.0/depth*j]);
				
				if (i > 0 && j > 0) {
					var lastLine = offset - depth;
					index(rightMesh, 6*offset, lastLine, lastLine - 1, offset - 1);
					index(rightMesh, 6*offset+3, lastLine, offset - 1, offset);
				}
			}
			
			// top
			if (i < depth && j < width) {
				var offset = i*width + j;
			
				vertex(topMesh, 5*offset, [j-(width-1)/2.0, (height-1)/2.0, i-(depth-1)/2.0], topNormal, [1.0/width*j, 1.0/depth*i]);
				
				if (i > 0 && j > 0) {
					var lastLine = offset - width;
					index(topMesh, 6*offset, lastLine, lastLine - 1, offset - 1);
					index(topMesh, 6*offset+3, lastLine, offset - 1, offset);
				}
			}
			
			// bottom
			if (i < depth && j < width) {
				var offset = i*width + j;
			
				vertex(bottomMesh, 5*offset, [j-(width-1)/2.0, -(height-1)/2.0, i-(depth-1)/2.0], bottomNormal, [1.0/width*j, 1.0/depth*i]);
				
				if (i > 0 && j > 0) {
					var lastLine = offset - width;
					index(bottomMesh, 6*offset, lastLine, offset - 1, lastLine - 1);
					index(bottomMesh, 6*offset+3, lastLine, offset, offset - 1);
				}
			}
		
		}
	}
	
	frontMesh.init();
	backMesh.init();
	leftMesh.init();
	rightMesh.init();
	topMesh.init();
	bottomMesh.init();
	
	var terrain = new Object();
	terrain.frontMesh = frontMesh;
	terrain.backMesh = backMesh;
	terrain.leftMesh = leftMesh;
	terrain.rightMesh = rightMesh;
	terrain.topMesh = topMesh;
	terrain.bottomMesh = bottomMesh;
	
	return terrain;
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