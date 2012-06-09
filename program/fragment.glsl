precision mediump float;

struct RenderSettings {
	bool lighting;
	int textureMapping;
};

struct Light {
	vec3 direction;
	vec3 color;
};

struct Material {
	vec3 ambientColor;
	float shininess;
};

uniform RenderSettings uRenderSettings;
uniform Light uLight;
uniform Material uMaterial;

varying float vHeight;
varying vec4 vVertexPosition;
varying vec3 vTransformedNormal;
varying vec2 vTextureCoord;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;
uniform vec2 uPixelSize;

uniform sampler2D uDiffuseMap;
uniform sampler2D uHeightMap;

// function protypes
float getDiffuseLightWeight(vec3 normal, vec3 direction);
float getSpecularLightWeight(vec3 position, vec3 normal, vec3 lightDirection, float shininess);

void main() {
	if (vHeight < 0.0) {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}

	vec3 normal = normalize(vTransformedNormal);

	vec4 fragmentColor;
	
	vec3 lightWeighting = vec3(1.0, 1.0, 1.0);
	//if (uRenderSettings.lighting) {
		vec3 lightDirection = (normalize(uViewMatrix*vec4(uLight.direction, 1.0))).xyz;
		//vec3 lightDirection = uLight.direction;
		float diffuseLightWeight = getDiffuseLightWeight(normal, lightDirection);
		float specularLightWeight = getSpecularLightWeight(vVertexPosition.xyz, normal, lightDirection, uMaterial.shininess);
		
		
		lightWeighting = uMaterial.ambientColor + vec3(1.0, 1.0, 0.8) * specularLightWeight + uLight.color*diffuseLightWeight;
	//}
	
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

float getDiffuseLightWeight(vec3 normal, vec3 direction) {
	return max(dot(normal, direction), 0.0);
}

float getSpecularLightWeight(vec3 position, vec3 normal, vec3 lightDirection, float shininess) {
	vec3 eyeDirection = normalize(-position);
	vec3 reflectionDirection = reflect(-lightDirection, normal);

	return pow(max(dot(reflectionDirection, eyeDirection), 0.0), shininess);
}