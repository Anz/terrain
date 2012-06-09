function RenderSettings() {
	this.lighting = 2;
	this.textureMapping = 1;
}

function Light() {
	this.direction = vec3.create();
	this.color = vec3.create();
}

function Material(ambientColor, diffuseColor, diffuseMap, heightMap) {
	this.ambientColor = ambientColor;
	this.diffuseColor = diffuseColor;
	this.diffuseMap = diffuseMap;
	this.heightMap = heightMap;
}


function drawMesh(program, mesh, material, renderSettings, light) {
	if (!program.loaded) {
		return;
	}
	
	gl.useProgram(program);
		
	// view matrix
	mat4.identity(viewMatrix);
	if (camera.x != 0 || camera.y != 0 || camera.z != 0) mat4.translate(viewMatrix, [-camera.x, -camera.y, camera.z]);
	if (camera.zoom != 1) mat4.scale(viewMatrix, [camera.zoom, camera.zoom, camera.zoom]);
	
	// model matrix
	mat4.identity(modelMatrix);
	mat4.translate(modelMatrix, [model.x, model.y, model.z]);
	if (model.rx != 0) mat4.rotate(modelMatrix, model.rx, [1, 0, 0]);
	if (model.ry != 0) mat4.rotate(modelMatrix, model.ry, [0, 1, 0]);
	if (model.rz != 0) mat4.rotate(modelMatrix, model.rz, [0, 0, 1]);
	if (model.sx != 1 || model.sy != 1 || model.sz != 1) mat4.scale(modelMatrix, [model.sx, model.sy, -model.sz]);
	
	// normal matrix
	var normalMatrix = mat3.create();
    mat4.toInverseMat3(modelMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
	
	// uniforms
	gl.uniformMatrix4fv(program.uProjectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(program.uViewMatrix, false, viewMatrix);
	gl.uniformMatrix4fv(program.uModelMatrix, false, modelMatrix);
	gl.uniformMatrix3fv(program.uNormalMatrix, false, normalMatrix);
	gl.uniform2f(program.uPixelSize, 1.0/material.heightMap.width, 1.0/material.heightMap.height);
	
	// render settings
	gl.uniform1i(program.uRenderSettings.lighting, renderSettings.lighting);
	gl.uniform1i(program.uRenderSettings.textureMapping, renderSettings.textureMapping);

	// light
	var adjustedLD = vec3.create();
	vec3.normalize(light.direction, adjustedLD);
	
	gl.uniform3fv(program.uLight.direction, adjustedLD);
	gl.uniform3fv(program.uLight.color, light.color);
	
	// material
	gl.uniform4fv(program.uMaterial.diffuseColor, material.diffuseColor);
	gl.uniform3fv(program.uMaterial.ambientColor, material.ambientColor);
	
	gl.uniform1i(program.uDiffuseMap, 0);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, material.diffuseMap);
	
	gl.uniform1i(program.uHeightMap, 1);
	gl.activeTexture(gl.TEXTURE0 + 1);
	gl.bindTexture(gl.TEXTURE_2D, material.heightMap);

	// vertices
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
	
	// vertex position
	gl.enableVertexAttribArray(program.aVertexPosition);
	gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, mesh.vertexSize*4, 0);
	
	// vertex texture coordinates
	gl.enableVertexAttribArray(program.aTextureCoord);
	gl.vertexAttribPointer(program.aTextureCoord, 2, gl.FLOAT, false, mesh.vertexSize*4, 3*4);

	// indices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
	
	// draw the buffer
	//if (mesh.type == gl.POINTS || mesh.type == gl.LINES || $('#faces').attr('checked')) {	
		gl.drawElements(mesh.type, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
	//} 
	/*if (mesh.type != gl.LINES && $('#wireframe').attr('checked')) {
	
		gl.uniform1i(program.uRenderSettings.useLight, false);
		gl.uniform1i(program.uRenderSettings.useDiffuseMap, false);
		gl.uniform1i(program.uDiffuseMap, 0);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, whiteMap);
	
		gl.uniform4f(program.uDiffuseColor, 0.6, 0.6, 0.6,1.0);
		gl.drawElements(gl.LINE_STRIP, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
	}
	
	if (mesh.type != gl.POINTS && $('#vertices').attr('checked')) {
	
		gl.uniform1i(program.uRenderSettings.useLight, false);
		gl.uniform1i(program.uRenderSettings.useDiffuseMap, false);
		gl.uniform1i(program.uDiffuseMap, 0);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, whiteMap);
	
		gl.uniform4f(program.uDiffuseColor, 0.0, 1.0, 0.0,1.0);
		gl.drawElements(gl.POINTS, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
	}*/
}

function load_texture(url){	
	var texture = gl.createTexture();
	texture.image = new Image();
	texture.image.onload = function() {
		texture.width = texture.image.width;
		texture.height = texture.image.height;
	
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	}

	texture.image.src = url;
	
	return texture;
}

function createTexture(pixels,width,height) {
	var data = new Uint8Array(pixels);
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	texture.width = width;
	texture.height = height;
	
	return texture;
}


function load_shader(vertexURL, fragmentURL) {
	var program = gl.createProgram();
	program.loaded = false;
	
	$.ajax({
	  url: vertexURL,
	  dataType: 'text'
	}).done(function(vertex) {	
		$.ajax({
		  url: fragmentURL,
		  dataType: 'text'
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
			program.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
			program.aVertexNormal = gl.getAttribLocation(program, 'aVertexNormal');
			program.aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
			
			// uniforms
			program.uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
			program.uViewMatrix = gl.getUniformLocation(program, 'uViewMatrix');
			program.uModelMatrix = gl.getUniformLocation(program, 'uModelMatrix');
			program.uNormalMatrix = gl.getUniformLocation(program, 'uNormalMatrix');
			program.uPixelSize = gl.getUniformLocation(program, 'uPixelSize');
			
			// render settings
			program.uRenderSettings = new Object();
			program.uRenderSettings.lighting = gl.getUniformLocation(program, 'uRenderSettings.lighting');
			program.uRenderSettings.textureMapping = gl.getUniformLocation(program, 'uRenderSettings.textureMapping');
			
			// light
			program.uLight = new Object();
			program.uLight.direction = gl.getUniformLocation(program, 'uLight.direction');
			program.uLight.color = gl.getUniformLocation(program, 'uLight.color');
			
			// material
			program.uMaterial = new Object();
			program.uMaterial.ambientColor = gl.getUniformLocation(program, 'uMaterial.ambientColor');
			program.uMaterial.diffuseColor = gl.getUniformLocation(program, 'uMaterial.diffuseColor');
			program.uDiffuseMap = gl.getUniformLocation(program, 'uDiffuseMap');
			program.uHeightMap = gl.getUniformLocation(program, 'uHeightMap');
			
			program.loaded = true;
		});
	});
	
	return program;
}