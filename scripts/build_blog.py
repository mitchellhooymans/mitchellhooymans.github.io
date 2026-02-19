import os
import re
import json
import datetime
import shutil

# Configuration
POSTS_DIR = 'blog/posts'
OUTPUT_DIR = 'blog'
TEMPLATE_FILE = 'blog/_template.html'
INDEX_FILE = 'pages/blog.html'

def parse_markdown(md_content):
    """
    Parses a markdown file with YAML frontmatter.
    Returns metadata (dict) and html_content (str).
    """
    # Split frontmatter and content
    parts = re.split(r'^---\s*$', md_content, maxsplit=2, flags=re.MULTILINE)
    
    if len(parts) < 3:
        # No frontmatter found
        return {}, md_text_to_html(md_content)
    
    frontmatter_raw = parts[1]
    markdown_raw = parts[2]
    
    # Parse YAML-like frontmatter (simple key: value parser)
    metadata = {}
    current_list_key = None
    
    for line in frontmatter_raw.strip().split('\n'):
        line = line.rstrip()
        if not line:
            continue
            
        # Check for list item (indentation + -)
        if line.strip().startswith('- ') and current_list_key:
            list_value = line.strip()[2:].strip().strip('"\'')
            if current_list_key not in metadata:
                metadata[current_list_key] = []
            elif not isinstance(metadata[current_list_key], list):
                # Convert previous single value to list if needed (though unlikely with this logic)
                metadata[current_list_key] = [metadata[current_list_key]]
                
            metadata[current_list_key].append(list_value)
            continue
            
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"\'')
            
            # Reset current list key
            current_list_key = None
            
            if not value:
                # Key with empty value -> likely start of a list
                current_list_key = key
                metadata[key] = [] # Initialize empty list
            elif value.startswith('[') and value.endswith(']'):
                 metadata[key] = [x.strip().strip('"\'') for x in value[1:-1].split(',')]
            elif value.lower() == 'true':
                metadata[key] = True
            elif value.lower() == 'false':
                metadata[key] = False
            else:
                metadata[key] = value

    # Convert Markdown to HTML
    try:
        import markdown
        html_content = markdown.markdown(markdown_raw)
    except ImportError:
        print("Warning: 'markdown' library not found. Using simple fallback parser.")
        html_content = md_text_to_html(markdown_raw)
        
    return metadata, html_content

def md_text_to_html(text):
    """
    A very basic Markdown to HTML converter as a fallback.
    """
    html = text
    
    # Escape HTML
    html = html.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    
    # Headers
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    
    # Bold
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'__(.*?)__', r'<strong>\1</strong>', html)
    
    # Italic
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    html = re.sub(r'_(.*?)_', r'<em>\1</em>', html)
    
    # Links
    html = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', html)
    
    # Paragraphs (simple)
    lines = html.split('\n')
    new_lines = []
    in_list = False
    
    for line in lines:
        line = line.strip()
        if not line:
            if in_list:
                new_lines.append('</ul>')
                in_list = False
            continue
            
        if line.startswith('- '):
            if not in_list:
                new_lines.append('<ul>')
                in_list = True
            new_lines.append(f'<li>{line[2:]}</li>')
        elif line.startswith('<h'):
             new_lines.append(line)
        else:
             new_lines.append(f'<p>{line}</p>')
             
    if in_list:
        new_lines.append('</ul>')
        
    return '\n'.join(new_lines)

def generate_post_html(metadata, content, template_content):
    """
    Injects content and metadata into the HTML template.
    """
    html = template_content
    
    # Replace metadata placeholders
    # Note: The template doesn't use standard jinja2 placeholders yet, 
    # it uses comments like <!-- UPDATE: Change title -->.
    # We will use string replacement or regex based on the template structure.
    
    # Title
    if 'title' in metadata:
        html = re.sub(r'<title>.*?</title>', f'<title>{metadata["title"]} | Mitchell Hooymans</title>', html)
        html = re.sub(r'<h1.*?>(.*?)</h1>', f'<h1 class="animate-fade-in-up" style="font-size: clamp(2rem, 5vw, 3.5rem); margin-bottom: var(--space-6); line-height: 1.2;">{metadata["title"]}</h1>', html, flags=re.DOTALL)

    # Description
    if 'description' in metadata:
        html = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{metadata["description"]}">', html)
        
    # Category
    if 'category' in metadata:
        html = re.sub(r'<span class="text-accent".*?>.*?</span>', f'<span class="text-accent" style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 0.9rem; display: block; margin-bottom: var(--space-4);">{metadata["category"]}</span>', html, flags=re.DOTALL)
        
    # Date
    if 'date' in metadata:
        # Format date if needed, assuming YYYY-MM-DD input
        try:
            date_obj = datetime.datetime.strptime(metadata['date'], '%Y-%m-%d')
            date_str = date_obj.strftime('%B %d, %Y')
        except ValueError:
            date_str = metadata['date']
            
        # Regex to find the date section is tricky without identifiers. 
        # We look for the calendar icon context.
        html = re.sub(r'(<i class="fas fa-calendar-alt"></i>\s*<span>).*?(</span>)', f'\\g<1>{date_str}\\g<2>', html, flags=re.DOTALL)

    # Reading Time
    if 'reading_time' in metadata:
        html = re.sub(r'(<i class="fas fa-clock"></i>\s*<span>).*?(</span>)', f'\\g<1>{metadata["reading_time"]}\\g<2>', html, flags=re.DOTALL)
        
    # Image
    if 'image' in metadata:
        # Open Graph
        html = re.sub(r'<meta property="og:image" content=".*?">', f'<meta property="og:image" content="https://mitchellhooymans.com/{metadata["image"].lstrip("../")}">', html)
        # Featured Image
        html = re.sub(r'<img src=".*?" alt=".*?"\s*style="width: 100%; height: auto; max-height: 500px; object-fit: cover; display: block;">', 
                      f'<img src="{metadata["image"]}" alt="{metadata.get("image_alt", "")}" style="width: 100%; height: auto; max-height: 500px; object-fit: cover; display: block;">', html)
        
        # Caption
        if 'caption' in metadata:
            html = re.sub(r'<figcaption.*?>.*?</figcaption>', f'<figcaption style="padding: 10px; color: var(--color-gray-500); text-align: center; font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.05);">{metadata["caption"]}</figcaption>', html, flags=re.DOTALL)
        else:
             # Remove caption if not provided
             html = re.sub(r'<figcaption.*?>.*?</figcaption>', '', html, flags=re.DOTALL)
        
    # Content
    # We look for the article content block
    content_start_marker = '<article class="post-content" style="max-width: 750px; margin: 0 auto;">'
    content_end_marker = '<!-- Tags -->'
    
    # We replace everything between markers, but we need to be careful.
    # The template has comments and instructions we want to remove.
    
    if content_start_marker in html:
        # Simple string split/join approach for reliability
        pre_content, remainder = html.split(content_start_marker, 1)
        if content_end_marker in remainder:
            existing_content, post_content = remainder.split(content_end_marker, 1)
            html = pre_content + content_start_marker + '\n' + content + '\n' + content_end_marker + post_content
            
    # Tags
    if 'tags' in metadata and isinstance(metadata['tags'], list):
        tags_html = '\n'.join([f'<a href="#" class="post-tag">#{tag}</a>' for tag in metadata['tags']])
        # Find the tags container
        tags_container_start = '<div class="post-tags"'
        tags_end = '</div>'
        
        # This is getting fragile with regex. Ideally we use BeautifulSoup or Jinja2.
        # But this is a fallback script.
        # Let's try to locate the tags div content.
        # Searching for the specific style attribute to be sure
        tags_marker = 'style="margin-top: 3rem; margin-bottom: 2rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem;">'
        if tags_marker in html:
            parts = html.split(tags_marker)
            if len(parts) > 1:
                subparts = parts[1].split('</div>', 1)
                html = parts[0] + tags_marker + '\n' + tags_html + '\n' + '</div>' + subparts[1]

    return html

def update_index_page(posts_metadata):
    """
    Updates the blog.html index page with the new list of posts.
    """
    if not os.path.exists(INDEX_FILE):
        print(f"Error: Index file {INDEX_FILE} not found.")
        return

    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        html = f.read()

    # Sort posts by date (newest first)
    sorted_posts = sorted(posts_metadata, key=lambda x: x.get('date', ''), reverse=True)
    
    grid_start_marker = '<div class="blog-grid" id="blogGrid">'
    grid_end_marker = '</div>\n    </section>'  # Approximate end marker based on indentation
    
    if grid_start_marker not in html:
         print("Error: Blog grid container not found in index file.")
         return
         
    # Generate HTML for posts
    posts_html = []
    
    for i, post in enumerate(sorted_posts):
        is_featured = i == 0 # First post is featured
        
        rel_link = f"../blog/{post['filename']}"
        date_str = post.get('date', '')
        try:
             date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d')
             formatted_date = date_obj.strftime('%B %d, %Y')
        except:
             formatted_date = date_str
             
        if is_featured:
            post_html = f'''
                <!-- Featured Post - {post.get('title')} -->
                <article class="featured-post reveal" data-category="{post.get('category', 'general').lower()}">
                    <div class="blog-card-image"><img src="{post.get('image')}" alt="{post.get('image_alt')}"></div>
                    <div class="blog-card-content">
                        <div class="featured-badge"><i class="fas fa-star"></i>Featured </div>
                        <div class="blog-card-meta"><span><i class="fas fa-calendar-alt"></i>{formatted_date}</span><span><i class="fas fa-folder"></i>{post.get('category')}</span></div>
                        <h3 class="blog-card-title"><a href="{rel_link}">{post.get('title')}</a></h3>
                        <p class="blog-card-excerpt">{post.get('description')}</p>
                        <div class="blog-card-footer"><a href="{rel_link}" class="read-more">Read Article <i class="fas fa-arrow-right"></i></a><span class="reading-time"><i class="fas fa-clock"></i>{post.get('reading_time')}</span></div>
                    </div>
                </article>'''
        else:
            post_html = f'''
                <!-- Blog Post - {post.get('title')} -->
                <article class="blog-card reveal delay-100" data-category="{post.get('category', 'general').lower()}">
                    <div class="blog-card-image"><img src="{post.get('image')}" alt="{post.get('image_alt')}"><span class="blog-card-category">{post.get('category')}</span></div>
                    <div class="blog-card-content">
                        <div class="blog-card-meta"><span><i class="fas fa-calendar-alt"></i>{formatted_date}</span></div>
                        <h3 class="blog-card-title"><a href="{rel_link}">{post.get('title')}</a></h3>
                        <p class="blog-card-excerpt">{post.get('description')}</p>
                        <div class="blog-card-footer"><a href="{rel_link}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a><span class="reading-time">{post.get('reading_time').replace('min read', 'min')}</span></div>
                    </div>
                </article>'''
        
        posts_html.append(post_html)
        
    posts_html_str = '\n'.join(posts_html)
    
    # Replace content in blog.html
    # We need to find where the grid ends.
    # Looking at the file content, the grid div closes before </section>.
    # We can use regex to replace the inner content of the grid div.
    
    pattern = r'(<div class="blog-grid" id="blogGrid">)(.*?)(</div>\s*</section>)'
    # Note: Regex replacement of large HTML blocks can be risky.
    # Splitting might be safer.
    
    parts = html.split(grid_start_marker)
    if len(parts) > 1:
        # Find the closing tag for the grid. 
        # Since it's nested divs, we can search for the section close tag which naturally follows.
        # But we must be careful about nested divs inside articles.
        # The articles are indentation based in my generated string, standard html is robust.
        # Let's assume the user hasn't modified the structure significantly.
        # The structure is <div class="blog-grid" ...> ... </div> \n </section>
        
        post_grid_remainder = parts[1]
        
        # Searching for the closing div of the grid. 
        # It is immediately followed by </section> usually, or script.
        # Let's look for the next </section> and back up one </div>.
        
        section_end_idx = post_grid_remainder.find('</section>')
        if section_end_idx != -1:
            # The closing div of the grid is likely the last </div> before </section>
            grid_content_end = post_grid_remainder.rfind('</div>', 0, section_end_idx)
            
            if grid_content_end != -1:
                new_html = parts[0] + grid_start_marker + '\n' + posts_html_str + '\n            ' + post_grid_remainder[grid_content_end:]
                
                with open(INDEX_FILE, 'w', encoding='utf-8') as f:
                    f.write(new_html)
                print(f"Updated {INDEX_FILE}")
            else:
                 print("Could not find closing div for blog grid")
        else:
             print("Could not find closing section tag")


def generate_related_posts_html(related_filenames, all_posts_metadata):
    """
    Generates HTML for related posts.
    """
    html_parts = []
    
    # lookup dict for fast access
    posts_lookup = {p['filename'].replace('.html', '.md'): p for p in all_posts_metadata}
    
    for filename in related_filenames:
        # Strip path if user provided it
        clean_filename = os.path.basename(filename)
        
        if clean_filename in posts_lookup:
            post = posts_lookup[clean_filename]
            
            # Format date
            date_str = post.get('date', '')
            try:
                 date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d')
                 formatted_date = date_obj.strftime('%B %d, %Y')
            except:
                 formatted_date = date_str
                 
            rel_link = post.get('filename')
            
            card_html = f'''
                <article class="blog-card"
                    style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); border-radius: var(--radius-xl); border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
                    <div class="blog-card-image" style="height: 200px; overflow: hidden; position: relative;">
                        <img src="{post.get('image')}" alt="{post.get('image_alt')}"
                            style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="blog-card-content" style="padding: 1.5rem;">
                        <div class="blog-card-meta"
                            style="color: var(--color-gray-500); font-size: 0.85rem; margin-bottom: 0.5rem;">
                            <span><i class="fas fa-calendar-alt"></i> {formatted_date}</span>
                        </div>
                        <h3 class="blog-card-title" style="font-size: 1.25rem; margin-bottom: 0.5rem;">
                            <a href="{rel_link}" style="color: var(--color-white);">{post.get('title')}</a>
                        </h3>
                        <p class="blog-card-excerpt"
                            style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; color: var(--color-gray-400); font-size: 0.95rem;">
                            {post.get('description')}</p>
                        <div class="blog-card-footer"
                            style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                            <a href="{rel_link}" class="read-more"
                                style="font-weight: 500; font-size: 0.9rem; color: var(--color-accent);">Read Article <i
                                    class="fas fa-arrow-right"></i></a>
                        </div>
                    </div>
                </article>'''
            html_parts.append(card_html)
            
    if not html_parts:
        return ""
        
    return '\n'.join(html_parts)

def main():
    if not os.path.exists(POSTS_DIR):
        print(f"Directory {POSTS_DIR} does not exist.")
        return
        
    if not os.path.exists(TEMPLATE_FILE):
        print(f"Template parsing {TEMPLATE_FILE} does not exist.")
        return

    with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
        template_content = f.read()

    # Pass 1: Collect metadata from all posts
    all_posts_metadata = []
    print(f"Scanning {POSTS_DIR}...")
    
    post_files = [f for f in os.listdir(POSTS_DIR) if f.endswith('.md')]
    
    for filename in post_files:
        filepath = os.path.join(POSTS_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        metadata, html_body = parse_markdown(content)
        metadata['filename'] = filename.replace('.md', '.html')
        # Store raw content for pass 2 to avoid re-reading/parsing
        metadata['html_body'] = html_body
        all_posts_metadata.append(metadata)

    # Pass 2: Generate HTML with related posts
    for post in all_posts_metadata:
        print(f"Generating {post['filename']}...")
        
        output_path = os.path.join(OUTPUT_DIR, post['filename'])
        html_content = generate_post_html(post, post['html_body'], template_content)
        
        # Inject Related Posts
        related_posts_html = ""
        if 'related_posts' in post and isinstance(post['related_posts'], list):
            related_posts_html = generate_related_posts_html(post['related_posts'], all_posts_metadata)
        
        # We need to replace the placeholder in the template.
        # The template has a specific structure for related posts we want to replace.
        # It's inside <div class="blog-grid" ...> ... </div> inside a related posts section.
        
        # Strategy: Replace the entire Related Posts section
        # Logic: 
        # 1. If related_posts_html is generated, we construct the full section HTML and replace the placeholder.
        # 2. If NO related posts, we remove the section entirely.
        
        related_start_marker = '<!-- Related Posts -->'
        footer_marker = '<!-- Footer -->'
        
        if related_start_marker in html_content and footer_marker in html_content:
            # Construct the new section if we have posts
            if related_posts_html:
                new_section = f'''{related_start_marker}
    <section class="section">
        <div class="container">
            <h2 style="text-align: center; margin-bottom: var(--space-8);">Related Posts</h2>
            <div class="blog-grid"
                style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 900px; margin: 0 auto;">
{related_posts_html}
            </div>
        </div>
    </section>

    '''
                # Replace the block
                # We use string partition/split to avoid regex issues with large blocks
                pre_related = html_content.split(related_start_marker)[0]
                post_footer = html_content.split(footer_marker)[1]
                html_content = pre_related + new_section + footer_marker + post_footer
                
            else:
                # Remove the section entirely
                pre_related = html_content.split(related_start_marker)[0]
                # We need to keep the footer marker
                post_footer = html_content.split(footer_marker)[1]
                # Check if we should clean up trailing newlines or spacing?
                # Usually fine.
                html_content = pre_related + '\n    ' + footer_marker + post_footer

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
            
    # Update Index
    update_index_page(all_posts_metadata)
    print("Done!")

if __name__ == "__main__":
    main()
