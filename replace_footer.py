import os
import re

files_to_update = [
    'tutorials/nbody.html',
    'tutorials/blackholes.html',
    'simulations/nbodysim.html',
    'simulations/projectile.html',
    'simulations/twobody.html',
    'simulations/threebody.html',
    'simulations/pendulum.html',
    'blog/_template.html',
    'blog/science-career-qa.html',
    'blog/programming.html'
]

base_path = r'C:\Users\uqmhooym\GitHub\mitchellhooymans.github.io'

repl = '''    <!-- Footer -->
    <div id="footer-placeholder"></div>

    <!-- JavaScript -->
    <script src="../js/footer.js"></script>
    <script src="../js/back-to-top.js"></script>
    <script src="../js/animations.js"></script>
    <script>
        new Footer().init('../');
    </script>'''

for f in files_to_update:
    path = os.path.join(base_path, f)
    if not os.path.exists(path):
        print(f"File not found: {f}")
        continue
    
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We find the start index of '<!-- Footer -->'
    # And the end index of '</footer>'
    start_str = '<!-- Footer -->'
    end_str = '</footer>'
    
    start_idx = content.find(start_str)
    if start_idx == -1:
        print(f"Could not find start in {f}")
        continue
    
    # Let's make sure we get the whitespace before <!-- Footer -->
    line_start_idx = content.rfind('\n', 0, start_idx)
    if line_start_idx != -1:
        start_idx = line_start_idx + 1 # include the indentation
        
    end_idx = content.find(end_str, start_idx)
    if end_idx == -1:
        print(f"Could not find end in {f}")
        continue
    
    end_idx += len(end_str)
    
    new_content = content[:start_idx] + repl + content[end_idx:]
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(new_content)
    
    print(f"Replaced footer in {f}")
