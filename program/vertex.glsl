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

attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat3 uNormalMatrix;
uniform vec2 uPixelSize;

uniform sampler2D uDiffuseMap;
uniform sampler2D uHeightMap;

uniform RenderSettings uRenderSettings;
uniform Light uLight;
uniform Material uMaterial;


varying vec4 vVertexPosition;
varying vec3 vTransformedNormal;
varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

vec3 calcNormalFromHeightMap() {
	vec2 size = vec2(2.0,0.0);

    vec4 wave = texture2D(uHeightMap, aTextureCoord);
	vec4 t01 = texture2D(uHeightMap, aTextureCoord+vec2(-uPixelSize.x, 0.0));
    vec4 t21 = texture2D(uHeightMap, aTextureCoord+vec2(uPixelSize.x, 0.0));
    vec4 t10 = texture2D(uHeightMap, aTextureCoord+vec2(0.0, -uPixelSize.y));
    vec4 t12 = texture2D(uHeightMap, aTextureCoord+vec2(0.0, uPixelSize.y));
	
	float s11 = wave.x;
    float s01 = (t01.x+t01.y+t01.z)/3.0*100.0;
    float s21 = (t21.x+t21.y+t21.z)/3.0*100.0;
    float s10 = (t10.x+t10.y+t10.z)/3.0*100.0;
    float s12 = (t12.x+t12.y+t12.z)/3.0*100.0;
    //vec3 va = normalize(vec3(size.xy,s21-s11));
    //vec3 vb = normalize(vec3(size.yx,s12-s10));
	
	vec3 va = normalize(vec3(size.x, s21-s01, size.y));
	vec3 vb = normalize(vec3(size.y, s12-s10, -size.x));
	
    return normalize(cross(va,vb));
}

void main() {
		float height = aVertexPosition.y;
		vec4 position;
		
		if (height >= 0.0) {
			vec4 texel = texture2D(uHeightMap, aTextureCoord);
			height += (texel.r + texel.g + texel.b) / 3.0 * 100.0;
			
			vTransformedNormal = uNormalMatrix * calcNormalFromHeightMap();
			
			position = uViewMatrix*vec4(aVertexPosition.x, aVertexPosition.y + height, aVertexPosition.z, 1.0);
		} else{
			vTransformedNormal = uNormalMatrix * vec3(0.0, 1.0, 0.0);
			
			position = uViewMatrix*vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);
		}
		
		vVertexPosition = uProjectionMatrix*position;
		gl_Position = vVertexPosition;
		
		float directionalLightWeighting = max(dot(vTransformedNormal, uLight.direction), 0.0);
		vLightWeighting = uMaterial.ambientColor + uLight.color*directionalLightWeighting;
		
		vTextureCoord = aTextureCoord;
		gl_PointSize = 3.0;

}