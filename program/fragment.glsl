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
		fragmentColor = vec4(0.3, 0.3, 0.3, 1.0);
	} else if (uRenderSettings.textureMapping == 2) {
		fragmentColor = texture2D(uHeightMap, vTextureCoord);
	} else if (uRenderSettings.textureMapping == 3) {
		fragmentColor = vec4((normal+vec3(1.0, 0.0, 1.0))/2.0, 1.0);
	} else if (uRenderSettings.textureMapping == 5) {
		fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
	} else {
		vec4 heightmap = texture2D(uHeightMap, vTextureCoord);
		float height = (heightmap.r + heightmap.g + heightmap.b) / 3.0;
				vec2 coord = vTextureCoord/2.0;
		float steil = dot(normal, vec3(0.0, 1.0, 0.0));
		
		float grassFactor = 0.2;
		float snowFactor = max(height-0.3, 0.0)*10.0;
		float sandFactor = max(0.06-height, 0.0)*20.0;
		float clipFactor = max(1.0-abs(steil), 0.0)*2.0;
		
		vec4 grass = texture2D(uDiffuseMap, coord);
		vec4 snow = texture2D(uDiffuseMap, coord+vec2(0.5, 0.0));
		vec4 clip = texture2D(uDiffuseMap, coord+vec2(0.0, 0.5));
		vec4 sand = texture2D(uDiffuseMap, coord+vec2(0.5, 0.5));
				
	
		fragmentColor = normalize(grassFactor*grass+snowFactor*snow+sandFactor*sand+clipFactor*clip);
		//fragmentColor = grass;
	}
	
	gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}