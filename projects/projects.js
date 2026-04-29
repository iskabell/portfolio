import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects, BASE_PATH } from "../global.js";

const projects = await fetchJSON(`${BASE_PATH}lib/projects.json`);

const projectsContainer = document.querySelector(".projects");
const title = document.querySelector(".projects-title");
const searchInput = document.querySelector(".searchBar");

let query = "";
let selectedYear = null;

if (projects && projectsContainer) {
  title.textContent = `Projects (${projects.length})`;
  updatePage();
}

function getSearchFilteredProjects() {
  return projects.filter((project) => {
    const values = Object.values(project).join("\n").toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function getVisibleProjects() {
  let filteredProjects = getSearchFilteredProjects();

  if (selectedYear !== null) {
    filteredProjects = filteredProjects.filter((project) => {
      return project.year === selectedYear;
    });
  }

  return filteredProjects;
}

function updatePage() {
  const searchFilteredProjects = getSearchFilteredProjects();
  const visibleProjects = getVisibleProjects();

  renderProjects(visibleProjects, projectsContainer, "h2");

  // Pie chart should show all years from the search results,
  // not only the selected year.
  renderPieChart(searchFilteredProjects);
}

function renderPieChart(projectsGiven) {
  const svg = d3.select("#projects-pie-plot");
  const legend = d3.select(".legend");

  svg.selectAll("path").remove();
  legend.selectAll("li").remove();

  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  const data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // If the selected year is no longer in the searched results, deselect it
  const selectedYearStillExists = data.some((d) => d.label === selectedYear);
  if (!selectedYearStillExists) {
    selectedYear = null;
  }

  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  const sliceGenerator = d3.pie()
    .value((d) => d.value);

  const arcData = sliceGenerator(data);

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcData.forEach((d, i) => {
    svg
      .append("path")
      .attr("d", arcGenerator(d))
      .attr("fill", colors(i))
      .attr("class", d.data.label === selectedYear ? "selected" : "")
      .on("click", () => {
        selectedYear = selectedYear === d.data.label ? null : d.data.label;
        updatePage();
      });
  });

  data.forEach((d, i) => {
    legend
      .append("li")
      .attr("class", `legend-item ${d.label === selectedYear ? "selected" : ""}`)
      .attr("style", `--color: ${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on("click", () => {
        selectedYear = selectedYear === d.label ? null : d.label;
        updatePage();
      });
  });
}

searchInput.addEventListener("input", (event) => {
  query = event.target.value;
  updatePage();
});