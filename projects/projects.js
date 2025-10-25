import { fetchJSON, renderProjects } from 'https://d-jnair.github.io/portfolio/global.js';

// Wrap everything in an async function to avoid top-level await issues
async function loadProjects() {
  try {
    // Fetch project data from JSON file
    const projects = await fetchJSON('https://d-jnair.github.io/portfolio/lib/projects.json');
    
    // Select the projects container
    const projectsContainer = document.querySelector('.projects');
    
    if (projectsContainer) {
      // Render the projects
      renderProjects(projects, projectsContainer, 'h2');
    }
    
    // Add project count to the title
    const projectsTitle = document.querySelector('.projects-title');
    if (projectsTitle && projects.length > 0) {
        projectsTitle.textContent = `Durga Nair's Projects (${projects.length})`;
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Call the function when the DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadProjects);
} else {
  loadProjects();
}
