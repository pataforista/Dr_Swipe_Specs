// @ts-ignore
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';

const vertex = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
  }
`;

const fragment = `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  varying vec2 vUv;

  void main() {
    float time = uTime * 0.2;
    vec2 uv = vUv;
    
    float noise = sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 - time);
    vec3 color = mix(uColor1, uColor2, uv.y + noise * 0.2);
    color = mix(color, uColor3, sin(uv.x * 5.0 + time) * 0.5 + 0.5);
    
    gl_FragColor = vec4(color, 0.4);
  }
`;

interface AuroraProps {
  colorStops?: string[];
  speed?: number;
}

export default function Aurora({ 
  colorStops = ['#0d9488', '#0f172a', '#1e293b'], 
  speed = 1.0 
}: AuroraProps) {
  const ctnDom = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!ctnDom.current) return;
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    ctnDom.current.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new Color(colorStops[0]) },
        uColor2: { value: new Color(colorStops[1]) },
        uColor3: { value: new Color(colorStops[2]) },
      },
      transparent: true,
    });

    const mesh = new Mesh(gl, { geometry, program });

    let animationId: number;
    const update = (t: number) => {
      animationId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001 * speed;
      renderer.render({ scene: mesh });
    };

    const resize = () => {
      if (!ctnDom.current) return;
      const width = ctnDom.current.clientWidth;
      const height = ctnDom.current.clientHeight;
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', resize);
    resize();
    animationId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [colorStops, speed]);

  return <div ref={ctnDom} className="absolute inset-0 -z-10 pointer-events-none opacity-50" />;
}
