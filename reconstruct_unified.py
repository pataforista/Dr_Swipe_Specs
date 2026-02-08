import json
import os
import sys

def reconstruct_unified():
    canon_dir = r"c:\Users\Admin\Desktop\Juegos ENARM\Dr_Swipe_Specs\CORE_CANON"
    index_path = os.path.join(canon_dir, "CORE_INDEX.jsonl")
    data_dir = r"c:\Users\Admin\Desktop\Juegos ENARM\Dr_Swipe_Specs\data"
    output_path = os.path.join(data_dir, "CORE_UNIFIED.jsonl")

    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    unified_lines = []

    if not os.path.exists(index_path):
        print(f"Error: Index not found at {index_path}")
        return

    with open(index_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if not line.strip(): continue
            try:
                index_entry = json.loads(line)
            except Exception as e:
                print(f"Error parsing index line {i+1}: {e}")
                continue

            domain = index_entry.get('domain', 'unknown')
            topic = index_entry.get('topic', 'unknown')
            rel_path = index_entry.get('path')
            abs_path = os.path.join(canon_dir, rel_path)

            if not os.path.exists(abs_path):
                print(f"Warning: File not found {abs_path}")
                continue

            print(f"Reading {abs_path}...")
            try:
                with open(abs_path, 'r', encoding='utf-8') as jf:
                    content = jf.read().strip()
                    if not content:
                        print(f"Empty file: {abs_path}")
                        continue
                    
                    # Try to parse as JSON first
                    try:
                        data = json.loads(content)
                        if isinstance(data, dict):
                            nodes = data.get('nodes', [])
                        elif isinstance(data, list):
                            nodes = data
                        else:
                            nodes = []
                    except json.JSONDecodeError:
                        # Try to parse as JSONL
                        nodes = []
                        for l in content.splitlines():
                            if l.strip():
                                try:
                                    nodes.append(json.loads(l))
                                except:
                                    pass
                
                for node in nodes:
                    if not isinstance(node, dict):
                        continue
                    
                    # Apply transformation to core_unified_v1
                    unified_node = {
                        "schema": "core_unified_v1",
                        "id": node.get('id'),
                        "domain": domain,
                        "topic": topic,
                        "source_path": rel_path,
                        "source_version": node.get('version'),
                        "tema": node.get('tema'),
                        "subtema": node.get('subtema'),
                        "enunciado": node.get('enunciado') or node.get('prompt') or node.get('pregunta'),
                        "escenario": node.get('escenario'),
                        "tipo_decision": node.get('tipo_decision'),
                        "opciones": [],
                        "respuesta_correcta": node.get('respuesta_correcta'),
                        "justificacion": node.get('justificacion'),
                        "letal_si_falla": node.get('letal_si_falla'),
                        "dificultad": node.get('dificultad'),
                        "tags": node.get('tags'),
                        "fuentes": node.get('fuentes'),
                        "original": node,
                        "extras": {}
                    }

                    # Normalize opciones
                    raw_opciones = node.get('opciones') or node.get('options')
                    if isinstance(raw_opciones, dict):
                        for k, v in raw_opciones.items():
                            resultado = "correcto" if k == node.get('respuesta_correcta') else None
                            unified_node['opciones'].append({
                                "id": k,
                                "texto": v,
                                "resultado": resultado,
                                "impacto": None
                            })
                    elif isinstance(raw_opciones, list):
                        for opt in raw_opciones:
                            unified_node['opciones'].append({
                                "id": opt.get('id'),
                                "texto": opt.get('texto') or opt.get('text'),
                                "resultado": opt.get('resultado') or opt.get('outcome'),
                                "impacto": opt.get('impacto') or opt.get('impact')
                            })

                    unified_lines.append(json.dumps(unified_node, ensure_ascii=False))
            except Exception as e:
                print(f"Error processing {abs_path}: {e}")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(unified_lines) + '\n')

    print(f"Successfully created {output_path} with {len(unified_lines)} nodes.")

if __name__ == "__main__":
    reconstruct_unified()
