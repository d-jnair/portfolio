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

function updateFileDisplay(filteredCommits) {
  const lines = filteredCommits.flatMap((d) => d.lines);

  // group by file, then sort by #lines descending
  const files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  // bind files to <div> children of <dl id="files">
  const filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
      (enter) =>
        enter.append('div').call((div) => {
          div.append('dt').append('code');
          div.append('dd');
        }),
      (update) => update,
      (exit) => exit.remove(),
    );

  // show file name + line count
  filesContainer
    .select('dt > code')
    .html((d) => `${d.name}<br><small>${d.lines.length} lines</small>`);

  // unit viz: one div.loc per line
  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc');
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

function updateCommitInfo(filteredCommits) {
  // Flatten lines out of filtered commits
  const filteredData = filteredCommits.flatMap((d) => d.lines);

  // Grab the existing <dl class="stats"> created by renderCommitInfo
  const dl = d3.select('#stats').select('dl.stats');
  if (dl.empty()) return;

  // Clear old contents
  dl.selectAll('*').remove();

  // --- Rebuild stats using filteredData + filteredCommits ---

  // Total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(filteredData.length);

  // Total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(filteredCommits.length);

  // Number of files
  const numFiles = d3.group(filteredData, (d) => d.file).size;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);

  // Maximum file length
  const fileLengths = d3.rollups(
    filteredData,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file,
  );
  const maxFileLength = d3.max(fileLengths, (d) => d[1]);
  dl.append('dt').text('Maximum file length (lines)');
  dl.append('dd').text(maxFileLength ?? 0);

  // Longest file
  const longestFileEntry = d3.greatest(fileLengths, (d) => d[1]);
  const longestFile = longestFileEntry ? longestFileEntry[0] : 'N/A';
  dl.append('dt').text('Longest file');
  dl.append('dd').text(longestFile);

  // Average file length
  const averageFileLength = d3.mean(fileLengths, (d) => d[1]) ?? 0;
  dl.append('dt').text('Average file length (lines)');
  dl.append('dd').text(Math.round(averageFileLength));

  // Average line length
  const avgLineLength = d3.mean(filteredData, (d) => d.length) ?? 0;
  dl.append('dt').text('Average line length (characters)');
  dl.append('dd').text(Math.round(avgLineLength));

  // Longest line
  const longestLineEntry = d3.greatest(filteredData, (d) => d.length);
  const longestLine = longestLineEntry ? longestLineEntry.length : 0;
  dl.append('dt').text('Longest line (characters)');
  dl.append('dd').text(longestLine);

  // Maximum depth
  const maxDepth = d3.max(filteredData, (d) => d.depth) ?? 0;
  dl.append('dt').text('Maximum depth');
  dl.append('dd').text(maxDepth);

  // Average depth
  const avgDepth = d3.mean(filteredData, (d) => d.depth) ?? 0;
  dl.append('dt').text('Average depth');
  dl.append('dd').text(avgDepth.toFixed(2));

  // Time of day that most work is done
  const workByPeriod = d3.rollups(
    filteredData,
    (v) => v.length,
    (d) =>
      new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').text('Most productive time of day');
  dl.append('dd').text(maxPeriod || 'N/A');

  // Day of week that most work is done
  const workByDay = d3.rollups(
    filteredData,
    (v) => v.length,
    (d) =>
      new Date(d.datetime).toLocaleString('en', { weekday: 'long' }),
  );
  const maxDay = d3.greatest(workByDay, (d) => d[1])?.[0];
  dl.append('dt').text('Most productive day of week');
  dl.append('dd').text(maxDay || 'N/A');
}

let xScale, yScale;
let commitProgress = 100;
let commitMaxTime;
let timeScale;
let filteredCommits;

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

    svg
      .append('g')
      .attr('class', 'x-axis')                              // NEW
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);

    // Add Y axis
    svg
      .append('g')
      .attr('class', 'y-axis')                              // just for consistency
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
    .data(sortedCommits, (d) => d.id)
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

  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function updateScatterPlot(data, commits) {
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

  const svg = d3.select('#chart').select('svg');

  if (svg.empty()) return; // safety

  // 1. update xScale domain
  xScale
    .domain(d3.extent(commits, (d) => d.datetime))
    .nice();

  // 2. recompute radius scale
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // 3. update x-axis only (y-axis is unchanged)
  const xAxis = d3
    .axisBottom(xScale)
    .tickFormat(d3.timeFormat('%b %d')); // or whatever number of ticks you like
  svg.select('g.x-axis').call(xAxis);

  // 4. update dots
  const dots = svg.select('g.dots');
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id) // keep key!!
    .join(
      (enter) =>
        enter
          .append('circle')
          .attr('cx', (d) => xScale(d.datetime))
          .attr('cy', (d) => yScale(d.hourFrac))
          .attr('r', (d) => rScale(d.totalLines))
          .attr('fill', (d) => {
            const hour = d.hourFrac;
            if (hour >= 6 && hour < 12) return 'rgba(255, 165, 0, 0.7)'; // morning
            if (hour >= 12 && hour < 18) return 'rgba(255, 200, 0, 0.7)'; // afternoon
            if (hour >= 18 && hour < 22) return 'rgba(255, 140, 0, 0.7)'; // evening
            return 'rgba(70, 130, 180, 0.7)'; // night
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
          }),
      (update) => update,
      (exit) => exit.remove(),
    )
    // ensure position/size updated for existing circles
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines));
}


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

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );
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

function initTimeSlider() {
  const slider = document.getElementById('commit-progress');
  slider.addEventListener('input', onTimeSliderChange);
  onTimeSliderChange();
}

function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  const timeEl = document.getElementById('commit-time');
  commitProgress = Number(slider.value);
  commitMaxTime = timeScale.invert(commitProgress);
  timeEl.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
  updateCommitInfo(filteredCommits);
}


// Main execution
let data, commits;

async function main() {
  data = await loadData();
  commits = processCommits(data);
  timeScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, 100]);
  commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  renderCommitInfo(data, commits);
  updateCommitInfo(filteredCommits);
  renderScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
  initTimeSlider();
}

main();

