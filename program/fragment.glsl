precision mediump float;

varying vec3 vLightWeighting;
varying vec4 vDiffuseColor;
varying vec2 vTextureCoord;

uniform sampler2D uDiffuseTexture;

void main() {
	vec4 texel = texture2D(uDiffuseTexture, vec2(vTextureCoord.s, vTextureCoord.t));

	gl_FragColor = vec4(vDiffuseColor.rgb * vLightWeighting, vDiffuseColor.a) * texel;
	//gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}