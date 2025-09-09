-- Insert sample knowledge base objects
INSERT INTO kb_objects (id, kind, title, body, tags, version, status, quality_score) VALUES
('motif_circle_1', 'motif', 'Simple Circle', '{"svg": "<circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\"/>", "description": "A basic blue circle"}', ARRAY['geometric', 'simple'], '1.0.0', 'active', 0.9),
('motif_square_1', 'motif', 'Basic Square', '{"svg": "<rect x=\"10\" y=\"10\" width=\"80\" height=\"80\" fill=\"red\"/>", "description": "A basic red square"}', ARRAY['geometric', 'angular'], '1.0.0', 'active', 0.8),
('style_minimal_1', 'style_pack', 'Minimal Style', '{"colors": ["#000000", "#FFFFFF"], "strokeWidth": 2, "fill": false}', ARRAY['minimal', 'monochrome'], '1.0.0', 'active', 0.95),
('rule_symmetry_1', 'rule', 'Horizontal Symmetry', '{"type": "symmetry", "axis": "horizontal", "weight": 0.8}', ARRAY['symmetry', 'balance'], '1.0.0', 'active', 0.7);

-- Insert sample generation events
INSERT INTO gen_events (user_id, prompt, intent, used_object_ids) VALUES
('user_1', 'Create a blue circle icon', '{"shape": "circle", "color": "blue", "style": "icon"}', ARRAY['motif_circle_1', 'style_minimal_1']),
('user_2', 'Make a red geometric shape', '{"shape": "square", "color": "red", "style": "geometric"}', ARRAY['motif_square_1']),
('user_1', 'Design a minimal logo', '{"type": "logo", "style": "minimal"}', ARRAY['style_minimal_1', 'rule_symmetry_1']);

-- Insert sample feedback
INSERT INTO gen_feedback (event_id, user_id, signal, weight) VALUES
(1, 'user_1', 'kept', 1.0),
(2, 'user_2', 'edited', 0.8),
(3, 'user_1', 'favorited', 1.2);

-- Insert sample user preferences
INSERT INTO user_preferences (user_id, weights) VALUES
('user_1', '{"tagWeights": {"minimal": 1.2, "geometric": 0.8}, "kindWeights": {"motif": 1.0, "style_pack": 1.1}}'),
('user_2', '{"tagWeights": {"angular": 1.1, "geometric": 1.0}, "kindWeights": {"motif": 1.2, "rule": 0.9}}');