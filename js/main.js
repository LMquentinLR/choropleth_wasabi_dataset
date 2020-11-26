import fetchJsonp from "fetch-jsonp"
import chroma from "chroma-js"
import swal from 'sweetalert'

let world = require("./../data/countries-50m.json")
let topoData = topojson.feature(world, world.objects.countries).features
// let translationUrl = require("./../data/world-translate.csv")
// let populationUrl = require("./../data/population-wb.csv")
// let cachedRawUrl = require("./../data/infection.txt")
// let musicUrl = require("./../data/music.csv")
let cachedRawUrl2 = require("./../data/test.txt")

let data = {}
let path = d3.geoPath(d3.geoNaturalEarth1())

let processRaw = raw => {
  // raw.data.worldlist.forEach(country => {
    raw.forEach(country => {
    data[country.name] = country;
//     data[country.name].computed = {};
//     if (country.name === "中国")
// data[country.name].conNum = data[country.name].value;
  });
  //console.log(data)
  //
  //
  //>
  // fetch(translationUrl)
  //   .then(res => res.text())
  //   .then(translations => {
  //>
  //
  //
      // fetch(musicUrl)
      //   .then(res => res.text())
      //   .then(music => {
  //
  //
  //>
        /*
        fetch(populationUrl)
        .then(res => res.text())
        .then(population => {
          */
  //>
  //
  //
          // let translationMap = new Map(
          //   d3.csvParse(translations, ({ en, zh }) => [en, zh])
          // );
  //
  //
  // >
          // let musicMap = new Map(
          //   d3.csvParse(music, ({ country, decade, genre_family, count, population }) => [
          //     country, 
          //     decade,
          //     genre_family,
          //     count,
          //     population
          //   ])
          // );
  // >
  //
  //
          // let populationMap = new Map(
          //   d3.csvParse(population, ({ country, population }) => [
          //     country,
          //     population
          //   ])
          // );

          const zoom = d3.zoom().scaleExtent([0.5, 8])

          const render = method => {
            d3.select("svg-frame").html("");
            d3.select("body").style(
              "background-color",
              ""
            );

            let { formula, dataDefault, style, properties } = method
            let formulaR = d => {
              if (isNaN(formula(d))) {
                console.warn("Invalid result for " + d.name)
                return 0
              }
              else return formula(d)
            }

            const resetRegion = () => {
              d3.select(".rate").html(
                dataDefault.toFixed(method.properties.toFixed)
              );
              d3.select(".city-name").html("World");
              d3.select(".grad-bar").style(
                "background",
                `linear-gradient(to right,${style.interpolation(
                  0.2
                )},${style.interpolation(0.5)},${style.interpolation(0.9)})`
              );
            };
            resetRegion();

            d3.select(".title .light").text(properties.title);
            d3.select(".desc").text(properties.desc);

            const svg = d3.select("svg-frame")
              .append("svg")
              .attr("viewBox", [170, -70, 630, 550]) // Global
              //.attr("viewBox", [150, -15, 400, 300]) // Atlantic

            const g = svg.append("g")

            g.attr("id", "geo-paths")
              .selectAll("path")
              .data(topoData)
              .join("path")
              .attr("class", "clickable")
              .attr("fill", d => {
                let name = d.properties.name;
                if (name.toLowerCase() in data) {
                  data[name.toLowerCase()].used = true;
                  data[name.toLowerCase()][method.properties.abbv] = formulaR(
                    d.properties
                  );
                  return style.paint(formulaR(d.properties));
                }
                return "#222";
              })
              .attr("d", path)
              .on("mouseover", d => {
                let name = d.properties.name;
                d3.select(".city-name").text(d.properties.name);
                if (name.toLowerCase() in data) {
                  d3.select(".rate").text(
                    formulaR(d.properties).toFixed(method.properties.toFixed)
                    );
                  } else {
                  d3.select(".rate").text(0);
                }
              })
              .on("click", d => {
                let name = d.properties.name;
                if (name.toLowerCase() in data) {
                  let c = style.paint(formulaR(d.properties));
                  d3.select("body").style(
                    "background-color",
                    chroma(c).alpha(0.75)
                  );
                } else {
                  d3.select("body").style("background-color", "");
                }
              })
              .on("mouseout", d => {
                resetRegion();
              })

            zoom.on('zoom', () => {
              g.attr('transform', d3.event.transform);
            });

            svg.call(zoom)

            for (let country in data) {
              if (!data[country].used) console.warn("Unused country", country);
            }
          };
          
          /*
          ----------------------
          DATES
          ----------------------
          */
         let decades = {
            /*
            2000
            */
            two_thousands: {
              properties: {
                title: "2000",
                abbv: "2000+",
                desc: "test_dec",
                toFixed: 0
              }
            },
            nineties: {
              properties: {
                title: "1990s",
                abbv: "90s",
                desc: "test_dec",
                toFixed: 0
              }
            },
            eighties: {
              properties: {
                title: "1980s",
                abbv: "80s",
                desc: "test_dec",
                toFixed: 0
              }
            },
            seventies: {
              properties: {
                title: "1970s",
                abbv: "70s",
                desc: "test_dec",
                toFixed: 0
              }
            },
            sixties: {
              properties: {
                title: "1960s",
                abbv: "60s",
                desc: "test_dec",
                toFixed: 0
              }
            },
          }
          /*
          ----------------------
          METHODS
          ----------------------
          */
          let methods = {
            rock: {
              formula: dProp => {
                let nm=dProp.name.toLowerCase();
                if (data[nm].data["rock"]["twothousands"]["population"] == 0) {
                  return 0
                } else {
                let val=Number(data[nm].data["rock"]["twothousands"]["count"])/
                  (Number(data[nm].data["rock"]["twothousands"]["population"])/1000000)*10;
                return val;
                }
              },
              dataDefault: 0,
              style: {
                paint: d3
                  .scalePow()
                  .interpolate(() => d3.interpolateCividis)
                  .exponent(0.15)
                  .domain([-1, 50]),
                interpolation: d3.interpolateCividis
              },
              properties: {
                title: "Rock",
                abbv: "rock",
                desc: "rock bands per 1m people",
                toFixed: 4
              }
            },
            metal: {
              formula: dProp => {
                let nm=dProp.name.toLowerCase();
                if (data[nm].data["metal"]["twothousands"]["population"] == 0) {
                  return 0
                } else {
                let val=Number(data[nm].data["metal"]["twothousands"]["count"])/
                  (Number(data[nm].data["metal"]["twothousands"]["population"])/1000000)*10;
                return val;
                }
              },
              dataDefault: 0,
              style: {
                paint: d3
                  .scalePow()
                  .interpolate(() => d3.interpolateCividis)
                  .exponent(0.15)
                  .domain([-1, 50]),
                interpolation: d3.interpolateCividis
              },
              properties: {
                title: "Metal",
                abbv: "metal",
                desc: "metal bands per 1m people",
                toFixed: 0
              }
            },
            punk: {
              formula: dProp => {
                let nm=dProp.name.toLowerCase();
                if (data[nm].data["punk"]["twothousands"]["population"] == 0) {
                  return 0
                } else {
                let val=Number(data[nm].data["punk"]["twothousands"]["count"])/
                  (Number(data[nm].data["punk"]["twothousands"]["population"])/1000000)*10;
                return val;
                }
              },
              dataDefault: 0,
              style: {
                paint: d3
                  .scalePow()
                  .interpolate(() => d3.interpolateCividis)
                  .exponent(0.15)
                  .domain([-1, 50]),
                interpolation: d3.interpolateCividis
              },
              properties: {
                title: "Punk",
                abbv: "punk",
                desc: "punk bands per 1m people",
                toFixed: 0
              }
            },
            countryfolk: {
              formula: dProp => {
                let nm=dProp.name.toLowerCase();
                if (data[nm].data["country"]["twothousands"]["population"] == 0) {
                  return 0
                } else {
                let val=Number(data[nm].data["country"]["twothousands"]["count"])/
                  (Number(data[nm].data["country"]["twothousands"]["population"])/1000000)*10;
                return val;
                }
              },
              dataDefault: 0,
              style: {
                paint: d3
                  .scalePow()
                  .interpolate(() => d3.interpolateCividis)
                  .exponent(0.15)
                  .domain([-1, 50]),
                interpolation: d3.interpolateCividis
              },
              properties: {
                title: "Country and Folk",
                abbv: "country&folk",
                desc: "Country, folk & reggae bands per 1m people",
                toFixed: 0
              }
            },
            hiphop: {
              formula: dProp => {
                let nm=dProp.name.toLowerCase();
                if (data[nm].data["hip"]["twothousands"]["population"] == 0) {
                  return 0
                } else {
                let val=Number(data[nm].data["hip"]["twothousands"]["count"])/
                  (Number(data[nm].data["hip"]["twothousands"]["population"])/1000000)*10;
                return val;
                }
              },
              dataDefault: 0,
              style: {
                paint: d3
                  .scalePow()
                  .interpolate(() => d3.interpolateCividis)
                  .exponent(0.15)
                  .domain([-1, 50]),
                interpolation: d3.interpolateCividis
              },
              properties: {
                title: "Hip Hop, Pop and Rap",
                abbv: "hip-hop&rap",
                desc: "Hip-Hop, Pop & Rap bands per 1m people",
                toFixed: 0
              }
            },
            jazz: {
              formula: dProp => {
                let nm=dProp.name.toLowerCase();
                if (data[nm].data["jazz"]["twothousands"]["population"] == 0) {
                  return 0
                } else {
                let val=Number(data[nm].data["jazz"]["twothousands"]["count"])/
                  (Number(data[nm].data["jazz"]["twothousands"]["population"])/1000000)*10;
                return val;
                }
              },
              dataDefault: 0,
              style: {
                paint: d3
                  .scalePow()
                  .interpolate(() => d3.interpolateCividis)
                  .exponent(0.15)
                  .domain([-1, 50]),
                interpolation: d3.interpolateCividis
              },
              properties: {
                title: "Jazz",
                abbv: "jazz",
                desc: "Jazz bands per 1m people",
                toFixed: 0
              }
            },
            electro: {
              formula: dProp => {
                let nm=dProp.name.toLowerCase();
                if (data[nm].data["electro"]["twothousands"]["population"] == 0) {
                  return 0
                } else {
                let val=Number(data[nm].data["electro"]["twothousands"]["count"])/
                  (Number(data[nm].data["electro"]["twothousands"]["population"])/1000000)*10;
                return val;
                }
              },
              dataDefault: 0,
              style: {
                paint: d3
                  .scalePow()
                  .interpolate(() => d3.interpolateCividis)
                  .exponent(0.15)
                  .domain([-1, 50]),
                interpolation: d3.interpolateCividis
              },
              properties: {
                title: "Electronic, Dubstep, EDM, Synth",
                abbv: "electronic",
                desc: "Electro bands per 1m people",
                toFixed: 0
              }
            },
            /*
            CONFIRMED
            */
            // confirmed: {
            //   formula: dProp =>
            //   Number(data[dProp.name].conNum),
            //     // Number(data[translationMap.get(dProp.name)].conNum),
            //   dataDefault: Number(raw.data.othertotal.certain),
            //   style: {
            //     paint: d3
            //       .scalePow()
            //       .interpolate(() => d3.interpolateCividis)
            //       .exponent(0.3)
            //       .domain([-1000, 3000000]),
            //     interpolation: d3.interpolateCividis
            //   },
            //   properties: {
            //     title: "Confirmed",
            //     abbv: "confirmed",
            //     desc: "Number of total infected people",
            //     toFixed: 0
            //   }
            // },
            // /*
            // R-CONFIRMED
            // */
            // rConfirmed: {
            //   formula: dProp => {
            //     let res =
            //       (Number(data[translationMap.get(dProp.name)].conNum) *
            //         10000) /
            //       populationMap.get(dProp.name);
            //     if (isNaN(res))
            //       console.warn("Missing population data", dProp.name);
            //     return res;
            //   },
            //   dataDefault: Number(raw.data.othertotal.certain) / 770000,
            //   style: {
            //     paint: d3
            //       .scalePow()
            //       .interpolate(() => d3.interpolateInferno)
            //       .exponent(0.5)
            //       .domain([-5, 150]),
            //     interpolation: d3.interpolateInferno
            //   },
            //   properties: {
            //     title: "Confirmed Ratio",
            //     abbv: "r-confirmed",
            //     desc: "Confirmed infections every 10,000 people",
            //     toFixed: 4
            //   }
            // },
            // /*
            // EXISTING
            // */
            // existing: {
            //   formula: dProp =>
            //     Number(data[translationMap.get(dProp.name)].conNum) -
            //     Number(data[translationMap.get(dProp.name)].cureNum) -
            //     Number(data[translationMap.get(dProp.name)].deathNum),
            //   dataDefault:
            //     Number(raw.data.othertotal.certain) -
            //     Number(raw.data.othertotal.die) -
            //     Number(raw.data.othertotal.recure),
            //   style: {
            //     paint: d3
            //       .scalePow()
            //       .interpolate(() => d3.interpolateCividis)
            //       .exponent(0.4)
            //       .domain([-1000, 800000]),
            //     interpolation: d3.interpolateCividis
            //   },
            //   properties: {
            //     title: "Existing Confirmed",
            //     abbv: "existing",
            //     desc: "Number of existing infected people",
            //     toFixed: 0
            //   }
            // },
            // /*
            // R-EXISTING
            // */
            // rExisting: {
            //   formula: dProp => {
            //     let existing =
            //       Number(data[translationMap.get(dProp.name)].conNum) -
            //       Number(data[translationMap.get(dProp.name)].cureNum) -
            //       Number(data[translationMap.get(dProp.name)].deathNum);
            //     let res = (existing * 10000) / populationMap.get(dProp.name);
            //     return res;
            //   },
            //   dataDefault:
            //     (Number(raw.data.othertotal.certain) -
            //       Number(raw.data.othertotal.die) -
            //       Number(raw.data.othertotal.recure)) /
            //     770000,
            //   style: {
            //     paint: d3
            //       .scalePow()
            //       .interpolate(() => d3.interpolateViridis)
            //       .exponent(0.3)
            //       .domain([-0.3, 55]),
            //     interpolation: d3.interpolateViridis
            //   },
            //   properties: {
            //     title: "Existing Ratio",
            //     abbv: "r-existing",
            //     desc: "Existing confirmed infections every 10,000 people",
            //     toFixed: 4
            //   }
            // },
            // /*
            // R-DEATH
            // */
            // rDeath: {
            //   formula: dProp => {
            //     let existing = Number(
            //       data[translationMap.get(dProp.name)].deathNum
            //     );
            //     let res = (existing * 10000) / populationMap.get(dProp.name);
            //     return res;
            //   },
            //   dataDefault: Number(raw.data.othertotal.die) / 770000,
            //   style: {
            //     paint: d3
            //       .scalePow()
            //       .interpolate(() => d3.interpolateReds)
            //       .exponent(0.3)
            //       .domain([-0.01, 10]),
            //     interpolation: d3.interpolateReds
            //   },
            //   properties: {
            //     title: "Motality Rate",
            //     abbv: "r-death",
            //     desc: "Deaths every 10,000 people",
            //     toFixed: 4
            //   }
            // },
            // /*
            // DEATH-TO-CONFIRMED
            // */
            // deathToConfirmed: {
            //   formula: dProp => {
            //     let existing = Number(
            //       data[translationMap.get(dProp.name)].deathNum /
            //         Number(data[translationMap.get(dProp.name)].conNum)
            //     );
            //     let res = existing;
            //     return res;
            //   },
            //   dataDefault: Number(raw.data.othertotal.die) / 770000,
            //   style: {
            //     paint: d3
            //       .scalePow()
            //       .interpolate(() => d3.interpolateReds)
            //       .exponent(0.4)
            //       .domain([-0.01, 0.5]),
            //     interpolation: d3.interpolateReds
            //   },
            //   properties: {
            //     title: "Death to Confirmed",
            //     abbv: "death-to-confirmed",
            //     desc: "Deaths / Confirmed Cases",
            //     toFixed: 4
            //   }
            // }
          };

          for (let method in methods) {
            d3.select(".methods")
              .append("input")
              .attr("type", "radio")
              .attr("name", "method-ratio")
              .attr("id", method)
              .on("click", () => render(methods[method]));

            d3.select(".methods")
              .append("label")
              .attr("for", method)
              .attr("class", "clickable")
              .text(methods[method].properties.abbv);
          };

          for (let decade in decades) {
            d3.select(".decades")
              .append("input")
              .attr("type", "radio")
              .attr("name", "method-ratio")
              .attr("id", decade)
              .on("click", () => render(decades[decade]));

            d3.select(".decades")
              .append("label")
              .attr("for", decade)
              .attr("class", "clickable")
              .text(decades[decade].properties.abbv);
          };

          // Fire the first render
          document.querySelector('label[for="rock"]').click();

          // function sortObject(obj) {
          //   var arr = [];
          //   for (var prop in obj) {
          //     if (
          //       obj.hasOwnProperty(prop) &&
          //       obj[prop].computed["confirmed"] !== undefined
          //     ) {
          //       arr.push({
          //         key: prop,
          //         value: obj[prop].computed["confirmed"]
          //       });
          //     }
          //   }
          //   arr.sort(function(a, b) {
          //     return a.value - b.value;
          //   });
          //   return arr;
          // }
          //console.log(sortObject(data));
      //  });
//     });
}

document.body.addEventListener("mousemove", e => {
  d3.select("html").style("background-position-x", +e.offsetX / 10.0 + "px")
  d3.select("html").style("background-position-y", +e.offsetY / 10.0 + "px")
})


fetch(cachedRawUrl2).then(res => res.json()).then(processRaw)