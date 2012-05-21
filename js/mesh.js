function createMesh(type, numVertices, numFaces) {
	var vertexSize = 8;
	var faceSize = 3;
	switch (type) {
		case gl.POINTS: faceSize = 1; break;
		case gl.LINES: faceSize = 2; break;
	}

	var mesh = {
		type: type,
		vertexSize: vertexSize,
		numVertices: numVertices,
		vertices: new Array(numVertices*vertexSize),
		numFaces: numFaces,
		faceSize: faceSize,
		numIndices: numFaces*faceSize,
		indices: new Array(numFaces*faceSize),
		init: function () {
			// vbo
			this.vbo = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
			
			// ibo
			this.ibo = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
		}
	};
	
	return mesh;
}