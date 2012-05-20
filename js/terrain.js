
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
	gl.depthFunc(gl.LESS);
	
	// load shader
	program = load_shader('program/vertex.glsl', 'program/fragment.glsl');
	
	// create terrain
	terrain = createTerrain(100, 3, 100);
	
	// setup projection matrix
	projectionMatrix = mat4.create();
	mat4.perspective(45, canvas.width/canvas.height, 0.1, 100, projectionMatrix);
	
	// setup view matrix
	viewMatrix = mat4.create();
	
	// setup model matrix
	modelMatrix = mat4.create();
	
	// camera
	camera = {x: 0, y: 0, z: 0, zoom: 0.25};
	
	// terrain
	model = {x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 1, sx: 0.1, sy: 0.1, sz: 0.01};
	terrain.normalMesh = createNormalMesh(terrain);
	
	// keyboard
	keys = new Object();
}

function update() {

	requestAnimationFrame(update);
	
	// navigation
	if (keys[65]) camera.x -= 0.1;
	if (keys[68]) camera.x += 0.1;
	if (keys[83]) camera.y -= 0.1;
	if (keys[87]) camera.y += 0.1;
	

	// clear buffer
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	
	// depth buffer
	if ($('#depthbuffer').attr('checked')) {
		gl.enable(gl.DEPTH_TEST);
	} else {
		gl.disable(gl.DEPTH_TEST);
	}
	
	// render
	var useLight = false;
	if ($('#lightening').attr('checked')) {
		useLight = true;
	}
	
	drawMesh(program, terrain, [0.3, 0.3, 0.3, 1.0], useLight);
	if ($('#normals').attr('checked')) {
		drawMesh(program, terrain.normalMesh, [1.0, 0.0, 0.0, 1.0], useLight);
	}
}

var f = 0.0;

function drawMesh(program, mesh, diffuseColor, useLight) {
	if (!program.loaded) {
		return;
	}
	
	gl.useProgram(program);
	
	f += 0.001;
	//f = Math.PI/4;
	
	// view matrix
	mat4.identity(viewMatrix);
	mat4.translate(viewMatrix, [-camera.x, -camera.y, camera.z]);
	mat4.translate(viewMatrix, [0.0, 0.0, -7.0]);
	mat4.rotate(viewMatrix, f*Math.PI/2, [0, 1, 0]);
	mat4.scale(viewMatrix, [camera.zoom, camera.zoom, camera.zoom]);
	
	// model matrix
	mat4.identity(modelMatrix);
	mat4.translate(modelMatrix, [model.x, model.y, model.z]);
	mat4.rotate(modelMatrix, model.rx, [1, 0, 0]);
	mat4.rotate(modelMatrix, model.ry, [0, 1, 0]);
	mat4.rotate(modelMatrix, model.rz, [0, 0, 1]);
	mat4.scale(modelMatrix, [model.sx, model.sy, model.sz]);
	
	// normal matrix
	var normalMatrix = mat3.create();
    mat4.toInverseMat3(modelMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
	
	//mat4.multiply(modelMatrix, viewMatrix, viewMatrix);
	
	// uniforms
	gl.uniformMatrix4fv(program.uProjectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(program.uViewMatrix, false, viewMatrix);
	gl.uniformMatrix3fv(program.uNormalMatrix, false, normalMatrix);
	gl.uniform4f(program.uDiffuseColor, diffuseColor[0], diffuseColor[1], diffuseColor[2], diffuseColor[3]);
	gl.uniform3f(program.uAmbientColor, 0.2, 0.2, 0.2);
	gl.uniform1i(program.uUseLight, useLight);

	// light
	var lightDirection = vec3.create();
	//vec3.normalize([-0.25, -0.25, -1.0], lightDirection);
	vec3.normalize([-0.4, -0.4, 0.0], lightDirection);
	//vec3.normalize([-Math.sin(f), -Math.cos(f), -Math.tan(f)], lightDirection);
	vec3.scale(lightDirection, -1);
	gl.uniform3fv(program.uLightDirection, lightDirection);
	gl.uniform3fv(program.uLightColor, [0.8, 0.8, 0.8]);

	// vertices
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
	gl.vertexAttribPointer(program.vertexPosition, 3, gl.FLOAT, false, 6*4, 0);
	gl.vertexAttribPointer(program.aVertexNormal, 3, gl.FLOAT, false, 6*4, 3*4);

	// indices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
	
	// draw the buffer
	if ($('#faces').attr('checked')) {
		gl.drawElements(mesh.type, mesh.numIndices, gl.UNSIGNED_SHORT, 0);
	} 
	if ($('#wireframe').attr('checked')) {
		gl.uniform4f(program.uDiffuseColor, 1.0, 1.0, 0.0,1.0);
		gl.drawElements(gl.LINE_STRIP, mesh.numIndices, gl.UNSIGNED_SHORT, 0);
	}
	
	if ($('#vertices').attr('checked')) {
		gl.uniform4f(program.uDiffuseColor, 0.0, 1.0, 0.0,1.0);
		gl.drawElements(gl.POINTS, mesh.numIndices, gl.UNSIGNED_SHORT, 0);
	}
}

function createTerrain(width, height, depth) {
	var mesh = createMesh(gl.TRIANGLES, width*height*depth*6, (2*(width-1)*(height-1)+2*(width-1)*(depth-1)+2*(height-1)*(depth-1))*6); 
	mesh.face_size = 6;
	
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
				var nx = (x <= 0) ? -1.0 : ((x >= width-1) ? 1.0 : 0.0);
				var ny = (y <= 0) ? -1.0 : ((y >= height-1) ? 1.0 : 0.0);
				var nz = (z <= 0) ? -1.0 : ((z >= depth-1) ? 1.0 : 0.0);
				var factor = 1.0/vec3.length([nx,ny,nz]);
				mesh.vertices[index++] = nx*factor;
				mesh.vertices[index++] = ny*factor;
				mesh.vertices[index++] = nz*factor;
			}
		}
	}
	
	// indices
	var index = 0;
	
	function mapping_faces(x, y, linex, liney, offset1,  offset2,  offset3,  offset4) {
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
				
				mesh.indices[index++] = vertex(v1);
				mesh.indices[index++] = vertex(v2);
				mesh.indices[index++] = vertex(v3);
				mesh.indices[index++] = vertex(v2);
				mesh.indices[index++] = vertex(v3);
				mesh.indices[index++] = vertex(v4);
				
				vec3.add(cursor, x);
			}
		}
	}
	
	// front
	mapping_faces([1,0,0], [0,1,0], width, height, [0,0,0], [1,0,0], [0,1,0], [1,1,0]);
	// back
	mapping_faces([1,0,0], [0,1,0], width, height, [0,0,depth-1], [1,0,depth-1], [0,1,depth-1], [1,1,depth-1]);
	// left
	mapping_faces([0,1,0], [0,0,1], height, depth, [0,0,0], [0,1,0], [0,0,1], [0,1,1]);
	// right
	mapping_faces([0,1,0], [0,0,1], height, depth, [width-1,0,0], [width-1,1,0], [width-1,0,1], [width-1,1,1]);
	// bottom
	mapping_faces([1,0,0], [0,0,1], width, depth, [0,0,0], [1,0,0], [0,0,1], [1,0,1]);	
	// top
	mapping_faces([1,0,0], [0,0,1], width, depth, [0,height-1,0], [1,height-1,0], [0,height-1,1], [1,height-1,1]);	
	
	mesh.init();
	
	return mesh;
}

function createNormalMesh(m) {	
	var mesh = createMesh(gl.LINES, m.vertices.length*2, m.vertices.length/m.vertex_size*2);
	
	var index = 0;
	for (var i = 0; i < m.vertices.length; i += m.vertex_size) {
		// position
		mesh.vertices[index++] = m.vertices[i];
		mesh.vertices[index++] = m.vertices[i+1];
		mesh.vertices[index++] = m.vertices[i+2];
		
		// normals
		mesh.vertices[index++] = m.vertices[i+3];
		mesh.vertices[index++] = m.vertices[i+4];
		mesh.vertices[index++] = m.vertices[i+5];
		
		// position
		mesh.vertices[index++] = m.vertices[i] + m.vertices[i+3]*0.5;
		mesh.vertices[index++] = m.vertices[i+1] + m.vertices[i+4]*0.5;
		mesh.vertices[index++] = m.vertices[i+2] + m.vertices[i+5]*0.5;
		
		// normals
		mesh.vertices[index++] = m.vertices[i+3];
		mesh.vertices[index++] = m.vertices[i+4];
		mesh.vertices[index++] = m.vertices[i+5];
	}
	
	for (var i = 0; i < m.vertices.length/mesh.vertex_size*2; i++) {
		mesh.indices[i] = i;
	}
	
	mesh.init();
	
	return mesh;
}

function createMesh(type, numVertices, numIndices) {
	var mesh = {
		type: type,
		vertex_size: 6,
		numVertices: numVertices,
		vertices: new Float32Array(numVertices),
		numIndices: numIndices,
		indices: new Uint16Array(numIndices),
		init: function () {
			// vbo
			this.vbo = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
			gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
			
			// ibo
			this.ibo = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
		}
	};
	
	return mesh;
}

function load_shader(vertexURL, fragmentURL) {
	var program = gl.createProgram();
	program.loaded = false;
	
	$.ajax({
	  url: vertexURL
	}).done(function(vertex) {
		$.ajax({
		  url: fragmentURL
		}).done(function(fragment) {
		
			// compile vertex shader
			var vertexShader = gl.createShader(gl.VERTEX_SHADER);
			gl.shaderSource(vertexShader, vertex);
			gl.compileShader(vertexShader);
			
			if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
				console.log('vertex compiler: ' +  gl.getShaderInfoLog(vertexShader));
				return;
			}
			
			// compile fragment shader
			var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fragmentShader, fragment);
			gl.compileShader(fragmentShader);
			
			if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
				console.log('fragment compiler: ' +  gl.getShaderInfoLog(vertexShader));
				return;
			}
			
			// attach our two shaders to the program
			gl.attachShader(program, vertexShader);
			gl.attachShader(program, fragmentShader);
			
			// linking
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				console.log('linking: ' + gl.getProgramInfoLog(program));
				return;
			}
			
			// setup shader
			gl.useProgram(program);
			
			// attributes
			program.vertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
			program.aVertexNormal = gl.getAttribLocation(program, 'aVertexNormal');
			gl.enableVertexAttribArray(program.vertexPosition);			
			
			// uniforms
			program.uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
			program.uViewMatrix = gl.getUniformLocation(program, 'uViewMatrix');
			program.uNormalMatrix = gl.getUniformLocation(program, 'uNormalMatrix');
			program.uUseLight = gl.getUniformLocation(program, 'uUseLight');
			program.uLightDirection = gl.getUniformLocation(program, 'uLightDirection');
			program.uLightColor = gl.getUniformLocation(program, 'uLightColor');
			program.uDiffuseColor = gl.getUniformLocation(program, 'uDiffuseColor');
			program.uAmbientColor = gl.getUniformLocation(program, 'uAmbientColor');
			
			program.loaded = true;
		});
	});
	
	return program;
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
	camera.zoom += e.wheelDelta ? e.wheelDelta/2000 : -e.detail/100;
	camera.zoom = Math.max(0, camera.zoom);
};


// init event
$(document).ready(function() {
	canvas = document.getElementById('canvas');
	editor_init();
	requestAnimationFrame(update);
	
	$('#toolbox').style.left = (window.innerWidth - 100) + 'px';
});

// window resize events
$(window).resize(function() {
	editor_init();
});