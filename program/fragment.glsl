precision mediump float;

varying vec3 vLightWeighting;
varying vec4 vDiffuseColor;

void main() {
	gl_FragColor = vec4(vDiffuseColor.rgb * vLightWeighting, vDiffuseColor.a);
}