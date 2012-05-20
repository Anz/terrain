attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat3 uNormalMatrix;

uniform vec4 uDiffuseColor;
uniform vec3 uAmbientColor;

uniform bool uUseLight;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;


varying vec3 vLightWeighting;
varying vec4 vDiffuseColor;

void main() {
		vec4 position = uViewMatrix*vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);

		gl_Position = uProjectionMatrix*position;
		vDiffuseColor = uDiffuseColor;
		gl_PointSize = 3.0;
		
		if (uUseLight) {
			vec3 transformedNormal = uNormalMatrix * aVertexNormal;
			float directionalLightWeighting = max(dot(transformedNormal, uLightDirection), 0.0);
			vLightWeighting = uAmbientColor + uLightColor*directionalLightWeighting;
		} else {
			vLightWeighting = vec3(1.0, 1.0, 1.0);
		}
		
}