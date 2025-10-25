import { fetchJSON, renderProjects } from 'https://d-jnair.github.io/portfolio/global.js';

// Fetch project data from JSON file
const projects = await fetchJSON('https://d-jnair.github.io/portfolio/lib/projects.json');

// Select the projects container
const projectsContainer = document.querySelector('.projects');

// Render the projects
renderProjects(projects, projectsContainer, 'h2');

// Add project count to the title
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle && projects.length > 0) {
    projectsTitle.textContent = `Durga Nair's Projects (${projects.length})`;
}
