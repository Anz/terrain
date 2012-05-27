struct RenderSettings {
	bool useLight;
	bool useDiffuseMap;
	bool useHeightMap;
};

struct Light {
	vec3 direction;
	vec3 color;
};

struct Material {
	vec3 ambientColor;
	vec4 diffuseColor;
};

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat3 uNormalMatrix;

uniform sampler2D uDiffuseMap;
uniform sampler2D uHeightMap;

uniform RenderSettings uRenderSettings;
uniform Light uLight;
uniform Material uMaterial;


varying vec3 vVertexNormal;
varying mat3 vNormalMatrix;

varying vec2 vTextureCoord;

void main() {
		float height = aVertexPosition.y;
		if (uRenderSettings.useHeightMap && height >= 0.0) {
			vec4 texel = texture2D(uHeightMap, aTextureCoord);
			height += (texel.r + texel.g + texel.b) / 3.0 * 100.0;
		}

		vVertexNormal = aVertexNormal;
		vNormalMatrix = uNormalMatrix;

		vec4 position = uViewMatrix*vec4(aVertexPosition.x, aVertexPosition.y + height, aVertexPosition.z, 1.0);

		gl_Position = uProjectionMatrix*position;
		gl_PointSize = 3.0;
		vTextureCoord = aTextureCoord;	

}