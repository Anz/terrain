function glTextureInit(obj) {
	// texture init
	function textureInit(texture, pixels, width, height, minFilter, maxFilter) {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, minFilter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, maxFilter);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	// create texture
	obj.newTexture = function(pixels, width, height, minFilter, maxFilter) {
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, minFilter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, maxFilter);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		gl.bindTexture(gl.TEXTURE_2D, null);
		texture.width = width;
		texture.height = height;
		
		return texture;
	}

	// load texture
	obj.loadTexture = function(url, data, callback) {
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
			gl.bindTexture(gl.TEXTURE_2D, null);
		
			/*gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			//texture = gl.newTexture(texture.image, texture.image.width, texture.image.height, gl.LINEAR, gl.LINEAR);
			textureInit(texture, texture.image, texture.image.width, texture.image.height, gl.LINEAR, gl.LINEAR);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);*/
			
			callback(texture, data);
		}

		texture.image.src = url;
	}
	
	// create fbo
	obj.newFBO = function(texture) {
		// framebuffer
		var fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		
		fbo.texture = texture;
		fbo.width = texture.width;
		fbo.height = texture.height;
		
		// renderbuffer
		fbo.renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texture.width, texture.height);
		
		// attach texture and renderbuffer to framebuffer
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fbo.renderbuffer);
		
		// unbind resources
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
		return fbo;
	}
}