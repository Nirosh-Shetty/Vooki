import json
from pathlib import Path
ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text())
seen = set()
merged_nodes = []
for n in ast.get('nodes', []):
    if n['id'] not in seen:
        seen.add(n['id'])
        merged_nodes.append(n)
merged_edges = ast.get('edges', [])
merged = {
    'nodes': merged_nodes,
    'edges': merged_edges,
    'hyperedges': [],
    'input_tokens': 0,
    'output_tokens': 0,
}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged))
Path('graphify-out/.graphify_semantic.json').write_text(json.dumps({'nodes': [], 'edges': [], 'hyperedges': []}))
print('ok', len(merged_nodes), len(merged_edges))
