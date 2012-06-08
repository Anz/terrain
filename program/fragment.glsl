precision mediump float;

struct RenderSettings {
	int lighting;
	bool useHeightMap;
	int textureMapping;
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

varying vec3 vTransformedNormal;
varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

uniform sampler2D uDiffuseMap;
uniform sampler2D uHeightMap;

void main() {	
	vec3 normal = normalize(vTransformedNormal);

	vec4 fragmentColor;
	
	vec3 lightWeighting = vec3(1.0, 1.0, 1.0);
	if (uRenderSettings.lighting == 2) {	
		float directionalLightWeighting = max(dot(normal, uLight.direction), 0.0);
		lightWeighting = uMaterial.ambientColor + uLight.color*directionalLightWeighting;
	} else if (uRenderSettings.lighting == 1) {	
		lightWeighting = vLightWeighting;
	}
	
	if (uRenderSettings.textureMapping == 0) {
		fragmentColor = vec4(0.3, 0.3, 0.3, 1.0);
	} else if (uRenderSettings.textureMapping == 2) {
		fragmentColor = texture2D(uHeightMap, vTextureCoord);
	}  else if (uRenderSettings.textureMapping == 3) {
		fragmentColor = vec4((normal+vec3(1.0, 0.0, 1.0))/2.0, 1.0);
	} else {
		fragmentColor = texture2D(uDiffuseMap, vTextureCoord);
	}
	

	gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}