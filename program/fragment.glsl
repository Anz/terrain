precision mediump float;

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

uniform RenderSettings uRenderSettings;
uniform Light uLight;
uniform Material uMaterial;

varying vec3 vVertexNormal;
varying mat3 vNormalMatrix;

varying vec2 vTextureCoord;

uniform sampler2D uDiffuseMap;
uniform sampler2D uHeightMap;

void main() {
	vec4 texel = vec4(1.0, 1.0, 1.0, 1.0);
	float direction = dot(normalize(vVertexNormal), vec3(0.0, 1.0, 0.0));
	if (uRenderSettings.useDiffuseMap && direction > 0.0) {
		texel = texture2D(uDiffuseMap, vTextureCoord);
	}
	
	vec3 vLightWeighting = vec3(1.0, 1.0, 1.0);
	if (uRenderSettings.useLight) {
		vec3 transformedNormal = vNormalMatrix * normalize(vVertexNormal);
		float directionalLightWeighting = max(dot(transformedNormal, uLight.direction), 0.0);
		vLightWeighting = uMaterial.ambientColor + uLight.color*directionalLightWeighting;
	}
	

	gl_FragColor = vec4(uMaterial.diffuseColor.rgb * vLightWeighting, uMaterial.diffuseColor.a) * texel;
}