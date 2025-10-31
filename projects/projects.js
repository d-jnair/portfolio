import { fetchJSON, renderProjects } from 'https://d-jnair.github.io/portfolio/global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

(async function() {
    // Fetch projects
    const projects = await fetchJSON('https://d-jnair.github.io/portfolio/lib/projects.json');
    const projectsContainer = document.querySelector('.projects');
    const projectsTitle = document.querySelector('.projects-title');
    const searchInput = document.querySelector('.searchBar');
    const svg = d3.select('#projects-pie-plot');
    const legendEl = d3.select('.legend');
    const HIGHLIGHT_COLOR = '#E1B000';

    let query = '';
    let selectedIndex= null;

    // Render initial projects
    renderProjects(projects, projectsContainer, 'h2');
    projectsTitle.textContent = `Durga Nair's Projects (${projects.length})`;

    // D3 setup
    const colors = d3.scaleOrdinal(d3.schemeTableau10);
    // Make pie smaller so legend can sit alongside comfortably
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(35);
    const sliceGenerator = d3.pie().value(d => d.value);
    let arcData = [];

    // Helper: filter projects based on search + selected slice
    function getFilteredProjects() {
        let filtered = projects.filter(p =>
            Object.values(p).join('\n').toLowerCase().includes(query.toLowerCase())
        );
        if (selectedIndex) {
            filtered = filtered.filter(p => p.year === selectedIndex);
        }
        return filtered;
    }

    function renderPieChart(projectsGiven) {
        svg.selectAll('*').remove();
        legendEl.selectAll('*').remove();

        // Rollup by year
        const rolledData = d3.rollups(
            projectsGiven,
            v => v.length,
            d => d.year
        );
        const data = rolledData.map(([year, count]) => ({ value: count, label: year }));
        arcData = sliceGenerator(data);

        // Draw slices
        svg.selectAll('path')
            .data(arcData)
            .enter()
            .append('path')
            .attr('d', arcGenerator)
            .attr('fill', (d,i) => colors(i))
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                svg.selectAll('path')
                    .filter(p => p !== d)
                    .attr('opacity', 0.3);
            })
            .on('mouseout', function(event, d) {
                svg.selectAll('path').attr('opacity', 1);
            })
            .on('click', (event, d) => {
                selectedIndex = selectedIndex === d.data.label ? null : d.data.label;

                // update pie slice fills (only highlight the selected one)
                svg.selectAll('path')
                    .attr('fill', (p,i) => p.data.label === selectedIndex ? HIGHLIGHT_COLOR : colors(i));

                // update legend swatches
                legendEl.selectAll('li')
                    .select('span.swatch')
                    .style('background-color', l => l.label === selectedIndex ? HIGHLIGHT_COLOR : colors(data.indexOf(l)));

                // update projects list
                updateProjects();
            });

        // Draw legend
        legendEl.selectAll('li')
            .data(data)
            .enter()
            .append('li')
            .each(function(d, i) {
                const li = d3.select(this);
                // Color box
                li.append('span')
                    .attr('class', 'swatch')
                    .style('background-color', colors(i));
                // Text
                li.append('span')
                    .text(`${d.label} (${d.value})`);
            });
    }

    function updateProjects() {
        const filtered = projects.filter(p => {
            const matchesQuery = Object.values(p).join('\n').toLowerCase().includes(query.toLowerCase());
            const matchesYear = selectedIndex === null || p.year === selectedIndex;
            return matchesQuery && matchesYear;
        });

        renderProjects(filtered, projectsContainer, 'h2');
        projectsTitle.textContent = `Durga Nair's Projects (${filtered.length})`;
    }

    function updateDisplay() {
        const filtered = getFilteredProjects();
        renderProjects(filtered, projectsContainer, 'h2');
        renderPieChart(filtered);
    }

    // Search bar listener
    searchInput.addEventListener('input', e => {
        query = e.target.value;
        updateDisplay();
    });

    // Initial render
    renderPieChart(projects);
})();
