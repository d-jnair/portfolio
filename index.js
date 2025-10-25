import { fetchJSON, renderProjects, fetchGitHubData } from 'https://d-jnair.github.io/portfolio/global.js';

// Wrap everything in an async function to avoid top-level await issues
async function loadPageContent() {
  try {
    // Fetch project data from JSON file
    const projects = await fetchJSON('https://d-jnair.github.io/portfolio/lib/projects.json');
    
    // Get the first 3 projects for display on home page
    const latestProjects = projects.slice(0, 3);
    
    // Select the projects container
    const projectsContainer = document.querySelector('.projects');
    
    if (projectsContainer) {
      // Render the latest projects
      renderProjects(latestProjects, projectsContainer, 'h2');
    }
    
    // Fetch GitHub data
    const githubData = await fetchGitHubData('d-jnair');
    
    // Select the profile stats container
    const profileStats = document.querySelector('#profile-stats');
    
    // Update the HTML with GitHub data
    if (profileStats) {
      profileStats.innerHTML = `
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
      `;
    }
  } catch (error) {
    console.error('Error loading page content:', error);
  }
}

// Call the function when the DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPageContent);
} else {
  loadPageContent();
}
