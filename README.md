# Mitchell Hooymans - Personal Website & Portfolio

Welcome to the source code for my personal website. This repository hosts my academic portfolio, research showcase, astrophotography gallery, educational tutorials, and interactive physics simulations.

## Features

- **Interactive N-Body Simulations**: Real-time gravitational dynamics simulators built with HTML Canvas and JavaScript (e.g. 2-body, 3-body, and N-body clusters).
- **Responsive Design Systems**: A unified, modern design system featuring glassmorphism cards, stochastically generated star backgrounds, and interactive hover states.
- **Dynamic Content Pipelines**: Procedurally generated canvas particle effects and responsive layouts optimized for all device sizes.
- **Rich Technical Tutorials**: Educational content covering subjects like astrophysical black holes and Python physics guides.
- **Astrophotography Gallery**: High-resolution image galleries showcasing original astrophotography.

## Tech Stack

This website is built entirely with fundamental web technologies to ensure maximum performance, accessibility, and longevity without relying on heavy frameworks:

- **Frontend**: HTML5, Vanilla JavaScript, and CSS3 (with CSS Variables for theming).
- **Styling**: Custom-built responsive grid systems and glassmorphism UI components. Icons provided by FontAwesome.
- **Animations & Graphics**: HTML `<canvas>` API for interactive simulations and particle effects.
- **Math Rendering**: MathJax for LaTeX equation rendering in physics tutorials.
- **Utility Scripts**: Python 3 for asset management and data plotting.

## Project Structure

- `assets/`: External library assets (e.g., fontawesome, older static assets).
- `blog/`: HTML files containing blog posts and articles.
- `css/`: Root directory CSS logic is handled in `styles.css`.
- `images/`: General website images and favicons.
- `js/`: JavaScript logic for navigation, footers, animations, etc.
- `pages/`: Core static landing pages (About, CV, Photography, etc.).
- `photography-images/`: High-resolution photography for the gallery.
- `scripts/`: Python utility scripts (e.g., mass function plotting logic).
- `simulations/`: Interactive gravitational dynamics and physics HTML canvases.
- `tutorials/`: Educational guides and coding tutorials.

## Local Development

To run this website locally, you only need a basic local web server to prevent CORS issues when loading local modules or assets. 

If you have Python installed, the easiest way is to use the built-in `http.server`:

1. Clone the repository: `git clone https://github.com/mitchellhooymans/mitchellhooymans.github.io.git`
2. Navigate to the project folder: `cd mitchellhooymans.github.io`
3. Start the local server: `python -m http.server 8000`
4. Open your browser and navigate to `http://localhost:8000`

## Development Utilities

This project includes Python scripts to assist with asset management:

- `generate_thumbs.py`: Automatically generates optimized thumbnails for the photography gallery.
- `analyze_images.py`: Utility for image analysis/metadata.

## License & Copyright

This project employs a dual-license model:

- **Source Code**: The HTML, CSS, JavaScript, and Python code is licensed under the **MIT License** (see [LICENSE.txt](LICENSE.txt)). You are free to use, modify, and learn from the code.
- **Content & Assets**: All photography, images, blog posts, and tutorial text are **Copyright © Mitchell Hooymans. All Rights Reserved.** unless stated otherwise.
  - You may **not** use, reproduce, or distribute the photography or written content without explicit written permission.
  - You may **not** use the photos for commercial purposes or in other projects.
