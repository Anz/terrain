precision mediump float;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// structures
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
	bool useHeightMap;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// attributes
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#ifdef VS
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
#endif

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// uniforms
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
uniform RenderSettings uRenderSettings;
uniform Light uLight;
uniform Material uMaterial;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;
uniform vec2 uPixelSize;

uniform sampler2D uDiffuseMap;
uniform sampler2D uHeightMap;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// varying
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//varying float vHeight;
varying vec4 vVertexPosition;
varying vec3 vTransformedNormal;
varying vec2 vTextureCoord;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// function prototypes
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
vec3 calcNormalFromHeightMap(sampler2D heightMap, vec2 textureCoord, vec2 pixelSize);
float getDiffuseLightWeight(vec3 normal, vec3 direction);
float getSpecularLightWeight(vec3 position, vec3 normal, vec3 lightDirection, float shininess);
vec4 getHeightMapColor(sampler2D heightMap, sampler2D diffuseMap, vec2 textureCoord, vec3 normal);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// vertex shader
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#ifdef VS

void main() {
		vec4 position = vec4(aVertexPosition, 1.0);
		vec3 normal = vec3(1.0, 1.0, 1.0);

		// if has heightmap, transform vertices
		if (uMaterial.useHeightMap) {
			vec4 texel = texture2D(uHeightMap, aTextureCoord);
			position.y += (texel.r + texel.g + texel.b) / 3.0 * 100.0;
			normal = calcNormalFromHeightMap(uHeightMap, aTextureCoord, uPixelSize);
		}
		
		vTransformedNormal = uNormalMatrix * normal;			
		vVertexPosition =  uViewMatrix*uModelMatrix*position;
		
		gl_Position = uProjectionMatrix*vVertexPosition;
		
		vTextureCoord = aTextureCoord;
		gl_PointSize = 3.0;
}

#endif

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// fragment shader
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#ifdef FS

void main() {
	vec3 normal = normalize(vTransformedNormal);

	vec4 fragmentColor;
	
	if (uRenderSettings.textureMapping == 2) {
		// height mapping
		fragmentColor = texture2D(uHeightMap, vTextureCoord);
	} else if (uRenderSettings.textureMapping == 3) {
		// normal mapping
		//fragmentColor = vec4(normalize((normal+vec3(1.0, 0.0, 1.0))/2.0), 1.0);
		fragmentColor = vec4(normalize(normal/2.0+0.5), 1.0);
	} else if (uRenderSettings.textureMapping == 5) {
		// depth mapping
		const float Near = 0.01;
		const float Far = 10000.0;
		const float LinearDepthConstant = 1.0 / (Far - Near);

		float linearDepth = length(vVertexPosition) * LinearDepthConstant;
		
		fragmentColor = vec4(linearDepth, linearDepth, linearDepth, 1.0);
	} else {
		// diffuse mapping
		fragmentColor = texture2D(uDiffuseMap, vTextureCoord);
		
		//if (uMaterial.useHeightMap) {
			fragmentColor = getHeightMapColor(uHeightMap, uDiffuseMap, vTextureCoord, normal);
		//}
		
		// lighting
		vec3 lightWeighting = vec3(1.0, 1.0, 1.0);
		//if (uRenderSettings.lighting) {
			vec3 lightDirection = (normalize(uViewMatrix*vec4(uLight.direction, 1.0))).xyz;
			//vec3 lightDirection = uLight.direction;
			float diffuseLightWeight = getDiffuseLightWeight(normal, lightDirection);
			float specularLightWeight = getSpecularLightWeight(vVertexPosition.xyz, normal, lightDirection, uMaterial.shininess);
			
			
			lightWeighting = uMaterial.ambientColor + vec3(1.0, 1.0, 0.8) * specularLightWeight + uLight.color*diffuseLightWeight;
		//}
		
		fragmentColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
	}
	
	gl_FragColor = fragmentColor;
}

#endif

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// function declaration
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
vec3 calcNormalFromHeightMap(sampler2D heightMap, vec2 textureCoord, vec2 pixelSize) {
	vec2 size = vec2(2.0,0.0);

    vec4 wave = texture2D(heightMap, textureCoord);
	vec4 t01 = texture2D(heightMap, textureCoord+vec2(-pixelSize.x, 0.0));
    vec4 t21 = texture2D(heightMap, textureCoord+vec2(pixelSize.x, 0.0));
    vec4 t10 = texture2D(heightMap, textureCoord+vec2(0.0, -pixelSize.y));
    vec4 t12 = texture2D(heightMap, textureCoord+vec2(0.0, pixelSize.y));
	
	float s11 = wave.x;
    float s01 = (t01.x+t01.y+t01.z)/3.0*100.0;
    float s21 = (t21.x+t21.y+t21.z)/3.0*100.0;
    float s10 = (t10.x+t10.y+t10.z)/3.0*100.0;
    float s12 = (t12.x+t12.y+t12.z)/3.0*100.0;
	
	vec3 va = normalize(vec3(size.x, s21-s01, size.y));
	vec3 vb = normalize(vec3(size.y, s12-s10, -size.x));
	
    return normalize(cross(va,vb));
}

float getDiffuseLightWeight(vec3 normal, vec3 direction) {
	return max(dot(normal, direction), 0.0);
}

float getSpecularLightWeight(vec3 position, vec3 normal, vec3 lightDirection, float shininess) {
	vec3 eyeDirection = normalize(-position);
	vec3 reflectionDirection = reflect(-lightDirection, normal);

	return pow(max(dot(reflectionDirection, eyeDirection), 0.0), shininess);
}

vec4 getHeightMapColor(sampler2D heightMap, sampler2D diffuseMap, vec2 textureCoord, vec3 normal) {
	vec4 fragmentColor;

	vec4 texel = texture2D(heightMap, vTextureCoord);
	float height = (texel.r + texel.g + texel.b) / 3.0;
	vec2 coord = vTextureCoord/2.0;
	
	float steil = dot(normal, vec3(0.0, 1.0, 0.0));

	if (height > 0.35) {
		fragmentColor = texture2D(diffuseMap, coord+vec2(0.5, 0.0));
	} else if (height < 0.02) {
		fragmentColor = texture2D(diffuseMap, coord+vec2(0.5, 0.5));
	} else {
		fragmentColor = texture2D(diffuseMap, coord);
	}
	
	float factor = min(max(1.0-steil, 0.0)*2.0, 1.0);
	
	return fragmentColor * (1.0-factor) + texture2D(diffuseMap, coord+vec2(0.0, 0.5)) * factor;
}