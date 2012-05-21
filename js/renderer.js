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
	if (mesh.type == gl.POINTS || mesh.type == gl.LINES || $('#faces').attr('checked')) {
		gl.drawElements(mesh.type, mesh.numIndices, gl.UNSIGNED_SHORT, 0);
	} 
	if (mesh.type != gl.LINES && $('#wireframe').attr('checked')) {
		gl.uniform4f(program.uDiffuseColor, 0.6, 0.6, 0.6,1.0);
		gl.drawElements(gl.LINE_STRIP, mesh.numIndices, gl.UNSIGNED_SHORT, 0);
	}
	
	if (mesh.type != gl.POINTS && $('#vertices').attr('checked')) {
		gl.uniform4f(program.uDiffuseColor, 0.0, 1.0, 0.0,1.0);
		gl.drawElements(gl.POINTS, mesh.numIndices, gl.UNSIGNED_SHORT, 0);
	}
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
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	}

	texture.image.src = url;
	
	return texture;
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