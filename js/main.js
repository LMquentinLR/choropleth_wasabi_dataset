// chroma.js: JavaScript library for color conversions and color scales
import chroma from "chroma-js";

// -----------------------------------------------------------------------------

// Imports of the data used to load the choropleth
let rawData = require("./../data/music-data.txt");
let rawWorldData = require("./../data/music-world-data.txt");
let rawGenreData = require("./../data/genre-summary.txt");
let world = require("./../data/countries-50m.json");
let topoData = topojson.feature(world, world.objects.countries).features;

// -----------------------------------------------------------------------------

// Variable declarations
let data = {};
let dataWorld = {};
let dataGenre = {};
let path = d3.geoPath(d3.geoNaturalEarth1());

// Global variable declaration
window.rendering = {
  genre: "rock",
  time: "twothousands",
  description: "rock bands referenced per 1m people",
  lowerBound: -1,
  upperBound: 15,
  dataDefault: 0,
  counter: 0,
  dec: ["sixties", "seventies", "eighties", "nineties","two_thousands"]
};

const colorSchemeMap = {
  // Map of music genre to color scheme
  rock: "interpolateCividis",
  metal: "interpolateRdPu",
  punk: "interpolateViridis",
  country: "interpolateReds",
  hip: "interpolateYlGnBu",
  jazz: "interpolateYlOrRd",
  electro: "interpolateGreens",
};

// -----------------------------------------------------------------------------
let processRaw = (raw) => {
  // Records the name of each data-available country in the variable <data>
  raw.forEach((country) => {
    data[country.name] = country;
  });

  fetch(rawWorldData)
    .then((res) => res.json())
    .then((rawWD) => {
      rawWD.forEach((country) => {
        dataWorld[country.name] = country;
      });

      fetch(rawGenreData)
        .then((res) => res.json())
        .then((rawGD) => {
          rawGD.forEach((genre) => {
            dataGenre[genre.name] = genre;
          });
          // ---------------------------------------------------------------------------
          // render :: method -> IO()
          // takes an object of class <method> and performs some IO actions

          const render = (method) => {
            // Updates the global variables stored in the object <window>
            method.updateGlobal();

            // Declares variables and functions to process the render
            const ColorScheme = colorSchemeMap[rendering.genre];
            const currentColorScheme = d3[ColorScheme];
            const fillCountryColor = d3
              .scalePow()
              .interpolate(() => d3[ColorScheme])
              .exponent(0.15)
              .domain([rendering.lowerBound, rendering.upperBound]);
            
            // Declares the choropleth's tooltip generic shape
            var tip = d3
              .select("body")
              .append("div")
              .attr("class", "tooltip")
              .style("color", "black")
              .style("opacity", 0)
              .style("z-index", "100");
            
            // Declares function to process the data sent to the choropleth
            const resetRegion = () => {
              d3.select(".rate").html(
                rendering.dataDefault.toFixed(method.properties.toFixed)
              );
              d3.select(".city-name").html("World");
              d3.select(".grad-bar").style(
                "background",
                `linear-gradient(to right, ${currentColorScheme(0.2)}, ` + 
                `${currentColorScheme(0.5)}, ${currentColorScheme(0.9)})`
              );
            };
            let tryCatchRenderProcessing = (d) => {
              if (isNaN(formula(d))) {
                console.warn("Invalid result for " + d.name);
                return 0;
              } else return formula(d);
            };

            // Retrieves the methods <formula>, <dataDefault>, <properties> of the object
            // <method> passed to the function render
            let { formula } = method;

            // Creates the map within the browser window
            resetRegion();
            d3.select("svg-frame").html("");
            d3.select("body").style("background-color", "");
            d3.select(".desc").text(rendering.description);

            const svg = d3
              .select("svg-frame")
              .append("svg")
              //  [left/right] [up/down] [zoom in/out] [Centering]
              .attr("viewBox", [220, -70, 500, 500]); // Global
              //.attr("viewBox", [170, -35, 400, 350]); // Atlantic

            const g = svg.append("g");
            g.attr("id", "geo-paths")
              .selectAll("path")
              .data(topoData)
              .join("path")
              .attr("class", "clickable")
              .attr("fill", (d) => {
                let name = d.properties.name;
                if (name.toLowerCase() in data) {
                  data[name.toLowerCase()].used = true;
                  return fillCountryColor(tryCatchRenderProcessing(d.properties));
                }
                return "#222";
              })
              .attr("d", path)
              // mouseover function
              // Casts the name, rate and tooltip affiliated to a country when hovered on
              .on("mouseover", (d) => {
                let name = d.properties.name;
                d3.select(".city-name").text(d.properties.name);
                if (name.toLowerCase() in data) {
                  d3.select(".rate").text(
                    tryCatchRenderProcessing(d.properties).toFixed(
                      method.properties.toFixed
                    )
                  );
                  // Creates a tooltip for the case when data is available
                  let tooltipCount =
                  data[name.toLowerCase()].data[rendering.genre][rendering.time]["count"];
                  let tooltipPop =
                  Math.round(
                    data[name.toLowerCase()].data[rendering.genre][rendering.time]["population"] / 
                    10000) / 100;
                  let totalCountryBands = 
                    dataWorld[name.toLowerCase()].data[rendering.time];
                  if (tooltipCount != 0) {
                    let tooltipText =
                      `Number of referenced ${rendering.genre} bands in ${name}:<br>` +
                      `<b>${tooltipCount}</b>, i.e. ` + 
                      `${Math.round((tooltipCount * 100) / totalCountryBands)}% of total ref. bands` +
                      `<hr>Average population of ${name} during the period:<br><b>${tooltipPop}m</b>`;
                      // Formats the tooltip to be included in the choropleth
                      tip
                      .html(tooltipText)
                      .transition()
                      .duration(600)
                      .style("opacity", 0.9)
                      .style("height", "100px")
                      .style("left", d3.event.pageX + "px")
                      .style("top", d3.event.pageY + "px");
                  } else {
                    // Creates a tooltip for the case when no data is available
                    let tooltipText = 
                      `No "${rendering.genre}" band was referenced during the period in ${name}.`;
                    // Formats the tooltip to be included in the choropleth
                    tip.html(tooltipText)
                      .transition()
                      .duration(600)
                      .style("opacity", 0.9)
                      .style("height", "40px")
                      .style("left", d3.event.pageX + "px")
                      .style("top", d3.event.pageY + "px");
                  }
                } else {
                  d3.select(".rate").text("N/A");
                }
              })
              // click function
              // Modifies the background color of the choropleth when a country is clicked on
              .on("click", (d) => {
                let name = d.properties.name;
                if (name.toLowerCase() in data) {
                  let c = fillCountryColor(tryCatchRenderProcessing(d.properties));
                  d3.select("body").style("background-color", chroma(c).alpha(0.2));
                } else {
                  d3.select("body").style("background-color", "");
                }
              })
              // mouseout function

              .on("mouseout", () => {
                resetRegion();
                // tooltip transition on moving out of the current location
                tip.transition().duration(600).style("opacity", 0);
              });

            // Zoom functionality
            const zoom = d3.zoom().scaleExtent([0.75, 10]);
            zoom.on("zoom", () => {g.attr("transform", d3.event.transform)});
            svg.call(zoom);

            // Warning message if a country in the source JSON is not used
            // for (let country in data) {
            //   if (!data[country].used) console.warn("Unused country", country);
            // }

          };
         
          // ---------------------------------------------------------------------------
          // Lists the methods of type 'decades'
          let decades = {
            // Update function for the global variables that formats the choropleth (e.g. legend)
            two_thousands: {
              updateGlobal: () => {
                rendering.time = "twothousands";
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
                },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "2000",
                abbv: "2000s",
                toFixed: 2,
              },
            },

            nineties: {
              // Update function for the global variables that formats the choropleth (e.g. legend)
              updateGlobal: () => {
                rendering.time = "nineties";
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
                },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "1990s",
                abbv: "90s",
                toFixed: 2,
              },
            },
            eighties: {
              // Update function for the global variables that formats the choropleth (e.g. legend)
              updateGlobal: () => {
                rendering.time = "eighties";
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
                },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "1980s",
                abbv: "80s",
                toFixed: 2,
              },
            },
            seventies: {
              // Update function for the global variables that formats the choropleth (e.g. legend)
              updateGlobal: () => {
                rendering.time = "seventies";
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
                },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "1970s",
                abbv: "70s",
                toFixed: 2,
              },
            },
            sixties: {
              // Update function for the global variables that formats the choropleth (e.g. legend)
              updateGlobal: () => {
                rendering.time = "sixties";
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
                },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "1960s",
                abbv: "60s",
                toFixed: 2,
              },
            },
          };

          // ---------------------------------------------------------------------------
          // Lists the methods of type 'musicGenres'

          let musicGenres = {
            rock: {
              // Update function for the global variables that formats the choropleth (e.g. legend)
              updateGlobal: () => {
                rendering.genre = "rock";
                rendering.description = "rock bands referenced per 1m people";
                rendering.lowerBound = -1;
                rendering.upperBound = 10;
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
                },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "Rock",
                abbv: "rock",
                toFixed: 2,
              },
            },
            metal: {
              // Update function for the global variables that formats the choropleth (e.g. legend)
              updateGlobal: () => {
                rendering.genre = "metal";
                rendering.description = "metal bands referenced per 1m people";
                rendering.lowerBound = -1;
                rendering.upperBound = 30;
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
                },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "Metal",
                abbv: "metal",
                toFixed: 2,
              },
            },
            punk: {
              // Update function for the global variables that formats the choropleth (e.g. legend)
              updateGlobal: () => {
                rendering.genre = "punk";
                rendering.description = "punk bands referenced per 1m people";
                rendering.lowerBound = -1;
                rendering.upperBound = 5;
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
                },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "Punk",
                abbv: "punk",
                toFixed: 2,
              },
            },
            countryfolk: {
              // Update function for the global variables that formats the choropleth (e.g. legend)
              updateGlobal: () => {
                rendering.genre = "country";
                rendering.description =
                  "Country, folk & reggae bands referenced per 1m people";
                rendering.lowerBound = -1;
                rendering.upperBound = 3;
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
                },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "Country and Folk",
                abbv: "country&folk",
                toFixed: 2,
              },
            },
            hiphop: {
              // Update function for the global variables that formats the choropleth (e.g. legend)
              updateGlobal: () => {
                rendering.genre = "hip";
                rendering.description =
                  "Hip-Hop, Pop & Rap bands referenced per 1m people";
                rendering.lowerBound = -1;
                rendering.upperBound = 60;
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
                },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "Hip Hop, Pop and Rap",
                abbv: "hip-hop&rap",
                toFixed: 2,
              },
            },
            jazz: {
              // Update function for the global variables that formats the choropleth (e.g. legend)
              updateGlobal: () => {
                rendering.genre = "jazz";
                rendering.description = "Jazz bands referenced per 1m people";
                rendering.lowerBound = -1;
                rendering.upperBound = 2;
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
                },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "Jazz",
                abbv: "jazz",
                toFixed: 2,
              },
            },
            electro: {
              // Update function for the global variables that formats the choropleth (e.g. legend)
              updateGlobal: () => {
                rendering.genre = "electro";
                rendering.description = "Electro bands referenced per 1m people";
                rendering.lowerBound = -1;
                rendering.upperBound = 30;
                rendering.dataDefault =
                  dataGenre[rendering.genre].data[rendering.time] /
                  (data["world"].data["rock"][rendering.time]["population"] / 1000000); // leave "rock" for pop data
              },
              // Update function for the statistics that will be displayed on the choropleth
              formula: (dProp) => {
                let countryName = dProp.name.toLowerCase();
                let countryPopulation =
                  data[countryName].data[rendering.genre][rendering.time]["population"];
                let countryCount = 
                  data[countryName].data[rendering.genre][rendering.time]["count"]
                if (countryPopulation == 0) {
                  return 0;
                } else {
                  let val = Number(countryCount) / (Number(countryPopulation) / 1000000);
                  return val;
                }
              },
              properties: {
                title: "Electronic, Dubstep, EDM, Synth",
                abbv: "electronic",
                toFixed: 2,
              },
            },
          };

          // loads the <musicGenres> method in the choropleth
          for (let musicGenre in musicGenres) {

            d3.select(".musicGenres")
              .append("input")
              .attr("type", "radio")
              .attr("name", "method-ratio")
              .attr("id", musicGenre)
              .on("click", () => render(musicGenres[musicGenre]));

            d3.select(".musicGenres")
              .append("label")
              .attr("for", musicGenre)
              .attr("class", "clickable")
              .text(musicGenres[musicGenre].properties.abbv);
          }

          // loads the <decades> method in the choropleth
          for (let decade in decades) {
            d3.select(".decades")
              .append("input")
              .attr("type", "radio")
              .attr("name", "method-ratio1")
              .attr("id", decade)
              .on("click", () => render(decades[decade]));

            d3.select(".decades")
              .append("label")
              .attr("for", decade)
              .attr("class", "clickable")
              .text(decades[decade].properties.abbv);
          };
          
          function functest2 () {
            setTimeout(function () {
                document.querySelector('label[for="'+rendering.dec[rendering.counter]+'"]').click();
                rendering.counter++;
                if (rendering.counter < rendering.dec.length) {
                    functest2();
                }; 
            }, 1000); // change this time (in milliseconds) to whatever you desire
        };

          function sleep(milliseconds) {
            const date = Date.now();
            let currentDate = null;
            do {
              currentDate = Date.now();
            } while (currentDate - date < milliseconds);
          };

          d3.select("#play-button")
            .attr("id", "play-button")
            .attr("class", "clickable")
            .on("click", () => { 
              functest2();
              rendering.counter = 0;
            }
          );


          // Initiates the first render on the label 'rock' and 'two_thousands'
          document.querySelector('label[for="rock"]').click();
          document.querySelector('label[for="two_thousands"]').click();

        });
    });
};

document.body.addEventListener("mousemove", (e) => {
  d3.select("html").style("background-position-x", +e.offsetX / 10.0 + "px");
  d3.select("html").style("background-position-y", +e.offsetY / 10.0 + "px");
});

fetch(rawData)
  .then((res) => res.json())
  .then(processRaw);