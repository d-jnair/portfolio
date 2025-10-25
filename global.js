console.log("IT'S ALIVE!");

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH = "https://d-jnair.github.io/portfolio/"

const pages = [
    {url: "", title:"Home"},
    {url: "cv/", title:"Resume"},
    {url: "projects/", title:"Projects"},
    {url: "contact/", title:"Contact"},
    {url: "https://github.com/d-jnair", title:"GitHub"}
];

document.querySelector("nav")?.remove();

const nav = document.createElement("nav");
document.body.prepend(nav);

for (const p of pages) {
    let url = p.url;
    if (!url.startsWith("http")) url = BASE_PATH + url;

    const a = document.createElement('a');
    a.href = url;
    a.textContent = p.title;
    nav.append(a);

    a.classList.toggle('current', a.host === location.host && a.pathname === location.pathname);
    a.toggleAttribute('target', a.host !== location.host);
    if (a.target === '_blank') a.rel = 'noopener noreferrer';
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
        Theme:
        <select id="theme-select" title="Color scheme">
            <option value="light dark">Automatic${
                matchMedia("(prefers-color-scheme:dark)").matches ? " (Dark)" : " (Light)"
            }</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
    `
);

const select = document.getElementById('theme-select');

function setColorScheme(value) {
    document.documentElement.style.setProperty('color-scheme', value);
    select.value = value;
    localStorage.colorScheme = value;
}

if ('colorScheme' in localStorage) {
    setColorScheme(localStorage.colorScheme);
}
else {
    setColorScheme('light dark');
}

select.addEventListener('input', (e) => {
    setColorScheme(e.target.value);
});

const form = document.querySelector('form[action^="mailto:"]');
form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const action = form.getAttribute('action');
    const params = [];
    for (const [name, value] of data) {
        params.push('${encodeURIComponent(name)}=${encodeURIComponent(value)}');
    }
    const url = '${action}?${params.join('&')}';
    location.href = url;
})

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    throw error;
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Clear existing content
  containerElement.innerHTML = '';
  
  // Create article element for each project
  projects.forEach(project => {
    const article = document.createElement('article');
    
    // Set the content dynamically
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <p>${project.description}</p>
    `;
    
    // Append to container
    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}