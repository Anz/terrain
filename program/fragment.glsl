precision mediump float;

struct RenderSettings {
	int lighting;
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

varying vec4 vVertexPosition;
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
		// none
		fragmentColor = vec4(0.3, 0.3, 0.3, 1.0);
	} else if (uRenderSettings.textureMapping == 2) {
		// height mapping
		fragmentColor = texture2D(uHeightMap, vTextureCoord);
	} else if (uRenderSettings.textureMapping == 3) {
		// normal mapping
		fragmentColor = vec4((normal+vec3(1.0, 0.0, 1.0))/2.0, 1.0);
	} else if (uRenderSettings.textureMapping == 5) {
		// light mapping
		fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
	} else {
		// diffuse mapping
		vec4 heightmap = texture2D(uHeightMap, vTextureCoord);
		float height = (heightmap.r + heightmap.g + heightmap.b) / 3.0;
				vec2 coord = vTextureCoord/2.0;
		float steil = dot(normal, vec3(0.0, 1.0, 0.0));
		
		if (height > 0.35) {
			fragmentColor = texture2D(uDiffuseMap, coord+vec2(0.5, 0.0));
		} else if (height < 0.02) {
			fragmentColor = texture2D(uDiffuseMap, coord+vec2(0.5, 0.5));
		} else {
			fragmentColor = texture2D(uDiffuseMap, coord);
		}
		
		float factor = min(max(1.0-steil, 0.0)*2.0, 1.0);
		
		fragmentColor = fragmentColor * (1.0-factor) + texture2D(uDiffuseMap, coord+vec2(0.0, 0.5)) * factor;
	}
	
	gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}