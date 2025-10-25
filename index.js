import { fetchJSON, renderProjects, fetchGitHubData } from 'https://d-jnair.github.io/portfolio/global.js';

// Fetch project data from JSON file
console.log('Fetching projects...');
const projects = await fetchJSON('https://d-jnair.github.io/portfolio/lib/projects.json');
console.log('Projects loaded:', projects.length, 'projects');
console.log('First project:', projects[0]);

// Get the first 3 projects for display on home page
const latestProjects = projects.slice(0, 3);
console.log('Latest projects:', latestProjects);

// Select the projects container
const projectsContainer = document.querySelector('.projects');
console.log('Projects container:', projectsContainer);

// Render the latest projects
if (projectsContainer) {
  renderProjects(latestProjects, projectsContainer, 'h2');
  console.log('Projects rendered');
} else {
  console.error('Projects container not found!');
}

// Fetch GitHub data
console.log('Fetching GitHub data...');
const githubData = await fetchGitHubData('d-jnair');
console.log('GitHub data:', githubData);

// Select the profile stats container
const profileStats = document.querySelector('#profile-stats');
console.log('Profile stats container:', profileStats);

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
  console.log('GitHub stats updated');
} else {
  console.error('Profile stats container not found!');
}
