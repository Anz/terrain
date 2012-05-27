function createNormalMesh(m) {	
	var mesh = createMesh(gl.LINES, m.numVertices*2, m.numVertices);
	
	var index = 0;
	var indicesIndex = 0;
	for (var i = 0; i < m.vertices.length; i += m.vertexSize) {
		// position
		mesh.vertices[index++] = m.vertices[i];
		mesh.vertices[index++] = m.vertices[i+1];
		mesh.vertices[index++] = m.vertices[i+2];
		
		// normals
		mesh.vertices[index++] = m.vertices[i+3];
		mesh.vertices[index++] = m.vertices[i+4];
		mesh.vertices[index++] = m.vertices[i+5];
		
		// texutre coordinates
		mesh.vertices[index++] = 0;
		mesh.vertices[index++] = 0;
		
		// position
		mesh.vertices[index++] = m.vertices[i] + m.vertices[i+3];
		mesh.vertices[index++] = m.vertices[i+1] + m.vertices[i+4];
		mesh.vertices[index++] = m.vertices[i+2] + m.vertices[i+5];
		
		// normals
		mesh.vertices[index++] = m.vertices[i+3];
		mesh.vertices[index++] = m.vertices[i+4];
		mesh.vertices[index++] = m.vertices[i+5];
		
		// texutre coordinates
		mesh.vertices[index++] = 0;
		mesh.vertices[index++] = 0;
		
		mesh.indices[indicesIndex] = indicesIndex++;
		mesh.indices[indicesIndex] = indicesIndex++;
	}
	
	mesh.init();
	
	return mesh;
}

function createFaceNormalMesh(m) {
	var mesh = createMesh(gl.LINES, m.numFaces*2, m.numFaces);
	
	var index = 0;
	var indicesIndex = 0;
	for (var i = 0; i < m.indices.length; i += m.faceSize) {
		var v1_index = m.indices[i]*m.vertexSize;
		var v2_index = m.indices[i+1]*m.vertexSize;
		var v3_index = m.indices[i+2]*m.vertexSize;
		
		var v1 = [m.vertices[v1_index], m.vertices[v1_index+1], m.vertices[v1_index+2]];
		var v2 = [m.vertices[v2_index], m.vertices[v2_index+1], m.vertices[v2_index+2]];
		var v3 = [m.vertices[v3_index], m.vertices[v3_index+1], m.vertices[v3_index+2]];
	
		var vcenter = vec3.create();
		vec3.add(vcenter, v1);
		vec3.add(vcenter, v2);
		vec3.add(vcenter, v3);
		vec3.scale(vcenter, 1.0/3.0);
		
		var a = vec3.create(), b = vec3.create(), normal = vec3.create();;
		vec3.subtract(v1, v2, a);
		vec3.subtract(v3, v1, b);
		vec3.cross(a, b, normal);
		vec3.normalize(normal);
	
		// position
		mesh.vertices[index++] = vcenter[0];
		mesh.vertices[index++] = vcenter[1];
		mesh.vertices[index++] = vcenter[2];
		
		// normals
		mesh.vertices[index++] = normal[0];
		mesh.vertices[index++] = normal[1];
		mesh.vertices[index++] = normal[2];
	
		// texutre coordinates
		mesh.vertices[index++] = 0;
		mesh.vertices[index++] = 0;
		
		// position
		mesh.vertices[index++] = vcenter[0] + normal[0];
		mesh.vertices[index++] = vcenter[1] + normal[1];
		mesh.vertices[index++] = vcenter[2] + normal[2];
		
		// normals
		mesh.vertices[index++] = normal[0];
		mesh.vertices[index++] = normal[1];
		mesh.vertices[index++] = normal[2];
		
		// texutre coordinates
		mesh.vertices[index++] = 0;
		mesh.vertices[index++] = 0;
		
		mesh.indices[indicesIndex] = indicesIndex++;
		mesh.indices[indicesIndex] = indicesIndex++;
	}
		
	mesh.init();
	
	return mesh;
}