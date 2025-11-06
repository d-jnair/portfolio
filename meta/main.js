import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Step 1.1: Reading the CSV file
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

// Step 1.2: Processing commit data
function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/d-jnair/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: true,
        writable: false,
        enumerable: false,
      });

      return ret;
    });
}

// Step 1.3: Displaying summary stats
function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Number of files
  const numFiles = d3.group(data, (d) => d.file).size;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);

  // Maximum file length
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file,
  );
  const maxFileLength = d3.max(fileLengths, (d) => d[1]);
  dl.append('dt').text('Maximum file length (lines)');
  dl.append('dd').text(maxFileLength);

  // Longest file
  const longestFileEntry = d3.greatest(fileLengths, (d) => d[1]);
  const longestFile = longestFileEntry ? longestFileEntry[0] : 'N/A';
  dl.append('dt').text('Longest file');
  dl.append('dd').text(longestFile);

  // Average file length
  const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append('dt').text('Average file length (lines)');
  dl.append('dd').text(Math.round(averageFileLength));

  // Average line length
  const avgLineLength = d3.mean(data, (d) => d.length);
  dl.append('dt').text('Average line length (characters)');
  dl.append('dd').text(Math.round(avgLineLength));

  // Longest line
  const longestLineEntry = d3.greatest(data, (d) => d.length);
  const longestLine = longestLineEntry ? longestLineEntry.length : 0;
  dl.append('dt').text('Longest line (characters)');
  dl.append('dd').text(longestLine);

  // Maximum depth
  const maxDepth = d3.max(data, (d) => d.depth);
  dl.append('dt').text('Maximum depth');
  dl.append('dd').text(maxDepth);

  // Average depth
  const avgDepth = d3.mean(data, (d) => d.depth);
  dl.append('dt').text('Average depth');
  dl.append('dd').text(avgDepth.toFixed(2));

  // Time of day that most work is done
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').text('Most productive time of day');
  dl.append('dd').text(maxPeriod || 'N/A');

  // Day of week that most work is done
  const workByDay = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { weekday: 'long' }),
  );
  const maxDay = d3.greatest(workByDay, (d) => d[1])?.[0];
  dl.append('dt').text('Most productive day of week');
  dl.append('dd').text(maxDay || 'N/A');
}

// Step 2: Scatterplot visualization
let xScale, yScale; // Make scales accessible for brushing

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Create scales
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

  // Add gridlines BEFORE the axes
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width),
  );

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  // Create radius scale for dot sizes
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  // Sort commits by size (descending) so smaller dots render on top
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // Draw dots
  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', (d) => {
      // Color based on time of day: bluer for night, orangish for day
      const hour = d.hourFrac;
      if (hour >= 6 && hour < 12) {
        // Morning: orange
        return 'rgba(255, 165, 0, 0.7)';
      } else if (hour >= 12 && hour < 18) {
        // Afternoon: yellow-orange
        return 'rgba(255, 200, 0, 0.7)';
      } else if (hour >= 18 && hour < 22) {
        // Evening: orange-red
        return 'rgba(255, 140, 0, 0.7)';
      } else {
        // Night: blue
        return 'rgba(70, 130, 180, 0.7)';
      }
    })
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // Step 5: Add brushing
  svg.call(d3.brush().on('start brush end', brushed));

  // Raise dots and everything after overlay
  svg.selectAll('.dots, .overlay ~ *').raise();
}

// Step 3: Tooltip functions
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id.substring(0, 7);
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
  time.textContent = commit.datetime?.toLocaleString('en', {
    timeStyle: 'short',
  });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
}

// Step 5: Brushing functions
function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }
  const [x0, y0] = selection[0];
  const [x1, y1] = selection[1];
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);
  return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

// Main execution
let data, commits;

async function main() {
  data = await loadData();
  commits = processCommits(data);
  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
}

main();

