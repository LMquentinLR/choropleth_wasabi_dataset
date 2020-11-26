import fetchJsonp from "fetch-jsonp";
import swal from "sweetalert";
import chroma from "chroma-js";

// Importing the data used by the choropleth
let rawData = require("./../data/test.txt");
let world = require("./../data/countries-50m.json");
let topoData = topojson.feature(world, world.objects.countries).features;

// Declaring variables for the JSON data records and the geodata paths
let data = {};
let path = d3.geoPath(d3.geoNaturalEarth1());

// Declaring global variable for rendering values (with defaults)
window.rendering = {
  genre: "rock",
  time: "twothousands",
  //interp: "interpolateCividis", //https://github.com/d3/d3-interpolate
};

const interpolationMaps = {
  "rock": "interpolateCividis",
  "metal":"interpolateRdPu",
  "punk":"interpolateViridis",
  "country":"interpolateReds",
  "hip":"interpolateYlGnBu",
  "jazz":"interpolateYlOrRd",
  "electro":"interpolateGreens"
}

//console.log(window)

let processRaw = (raw) => {
  // Renders the name of each available country
  raw.forEach((country) => {
    data[country.name] = country;
  });

  const render = (method) => {
    //console.log(method.style, rendering.interp)
    
    method.updateGlobal()
    const currentInterp = interpolationMaps[rendering.genre]
    const interpolation = d3[currentInterp];
    const paint = d3
      .scalePow()
      .interpolate(() => d3[currentInterp])
      .exponent(0.15)
      .domain([-1, 50]);

    d3.select("svg-frame").html("");
    d3.select("body").style("background-color", "");

    let { formula, dataDefault, properties } = method;
    //let { formula, dataDefault, style, properties } = method
    let formulaR = (d) => {
      if (isNaN(formula(d))) {
        console.warn("Invalid result for " + d.name);
        return 0;
      } else return formula(d);
    };

    const resetRegion = () => {
      d3.select(".rate").html(dataDefault.toFixed(method.properties.toFixed));
      d3.select(".city-name").html("World");
      d3.select(".grad-bar").style(
        "background",
        `linear-gradient(to right,${interpolation(0.2)},${interpolation(
          0.5
        )},${interpolation(0.9)})`
      );
    };
    resetRegion();

    //d3.select(".title .light").text(properties.title);
    d3.select(".desc").text(properties.desc);

    const svg = d3
      .select("svg-frame")
      .append("svg")
      .attr("viewBox", [170, -70, 630, 550]); // Global
    //.attr("viewBox", [150, -15, 400, 300]) // Atlantic

    // Creates the map within the browser window
    const g = svg.append("g");
    g.attr("id", "geo-paths")
      .selectAll("path")
      .data(topoData)
      .join("path")
      .attr("class", "clickable")
      .attr("fill", (d) => {
        let name = d.properties.name;
        if (name.toLowerCase() in data) {
          // data[name.toLowerCase()].used = true;
          //data[name.toLowerCase()][method.properties.abbv] = formulaR(
          //   d.properties
          // );
          return paint(formulaR(d.properties));
        }
        return "#222";
      })
      .attr("d", path)
      .on("mouseover", (d) => {
        let name = d.properties.name;
        d3.select(".city-name").text(d.properties.name);
        if (name.toLowerCase() in data) {
          d3.select(".rate").text(
            formulaR(d.properties).toFixed(method.properties.toFixed)
          );
        } else {
          d3.select(".rate").text("N/A");
        }
      })
      .on("click", (d) => {
        let name = d.properties.name;
        if (name.toLowerCase() in data) {
          let c = paint(formulaR(d.properties));
          d3.select("body").style("background-color", chroma(c).alpha(0.75));
        } else {
          d3.select("body").style("background-color", "");
        }
      })
      .on("mouseout", (d) => {
        resetRegion();
      });

    // Zoom functionality
    const zoom = d3.zoom().scaleExtent([0.75, 10]);
    zoom.on("zoom", () => {
      g.attr("transform", d3.event.transform);
    });
    svg.call(zoom);

    // Warning message if a country in the source JSON is not used
    //for (let country in data) {if (!data[country].used) console.warn("Unused country", country);}
  };

  /*
    ----------------------
    DATES
    ----------------------
    */
  let decades = {
    two_thousands: {
      updateGlobal: () => {
        rendering.time = "twothousands";
      },
      formula: (dProp) => {
        //rendering.time = "twothousands";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "2000",
        abbv: "2000s",
        desc: "test_dec",
        toFixed: 3,
      },
    },
    nineties: {
      updateGlobal: () => {
        rendering.time = "nineties";
      },
      formula: (dProp) => {
        //rendering.time = "nineties";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        //console.log(`Current genre: ${rendering.genre}. Interpolation: ${interpolationMaps[rendering.genre]}`)
        //console.log(`Current genre: ${rendering.genre}. Interpolation: ${rendering.interp}`)
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "1990s",
        abbv: "90s",
        desc: "test_dec",
        toFixed: 3,
      },
    },
    eighties: {
      updateGlobal: () => {
        rendering.time = "eighties";
      },
      formula: (dProp) => {
        //rendering.time = "eighties";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "1980s",
        abbv: "80s",
        desc: "test_dec",
        toFixed: 3,
      },
    },
    seventies: {
      updateGlobal: () => {
        rendering.time = "seventies";
      },
      formula: (dProp) => {
        //rendering.time = "seventies";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "1970s",
        abbv: "70s",
        desc: "test_dec",
        toFixed: 3,
      },
    },
    sixties: {
      updateGlobal: () => {
        rendering.time = "sixties";
      },
      formula: (dProp) => {
        //rendering.time = "sixties";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "1960s",
        abbv: "60s",
        desc: "test_dec",
        toFixed: 3,
      },
    },
  };
  /*
    ----------------------
    METHODS
    ----------------------
    */
  let methods = {
    rock: {
      updateGlobal: () => {
        rendering.genre = "rock";
        //rendering.interp = "interpolateCividis";
      },
      formula: (dProp) => {
        //rendering.genre = "rock";
        //rendering.interp = "interpolateCividis";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "Rock",
        abbv: "rock",
        desc: "rock bands per 1m people",
        toFixed: 3,
      },
    },
    metal: {
      //rendering.interp -> interpolationMaps[rendering.genre]
      updateGlobal: () => {
        rendering.genre = "metal";
        //rendering.interp = "interpolateRdPu";
      },
      formula: (dProp) => {
        //rendering.genre = "metal";
        //rendering.interp = "interpolateRdPu";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "Metal",
        abbv: "metal",
        desc: "metal bands per 1m people",
        toFixed: 3,
      },
    },
    punk: {
      updateGlobal: () => {
        rendering.genre = "punk";
       //rendering.interp = "interpolateViridis";
      },
      formula: (dProp) => {
        //rendering.genre = "punk";
        //rendering.interp = "interpolateViridis";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "Punk",
        abbv: "punk",
        desc: "punk bands per 1m people",
        toFixed: 3,
      },
    },
    countryfolk: {
      updateGlobal: () => {
        rendering.genre = "country";
        //rendering.interp = "interpolateReds";
      },
      formula: (dProp) => {
        //rendering.genre = "country";
        //rendering.interp = "interpolateReds";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "Country and Folk",
        abbv: "country&folk",
        desc: "Country, folk & reggae bands per 1m people",
        toFixed: 3,
      },
    },
    hiphop: {
      updateGlobal: () => {
        rendering.genre = "hip";
        //rendering.interp = "interpolateYlGnBu";
      },
      formula: (dProp) => {
        //rendering.genre = "hip";
        //rendering.interp = "interpolateYlGnBu";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "Hip Hop, Pop and Rap",
        abbv: "hip-hop&rap",
        desc: "Hip-Hop, Pop & Rap bands per 1m people",
        toFixed: 3,
      },
    },
    jazz: {
      updateGlobal: () => {
        rendering.genre = "jazz";
        //rendering.interp = "interpolateYlOrRd";
      },
      formula: (dProp) => {
        //rendering.genre = "jazz";
        //rendering.interp = "interpolateYlOrRd";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "Jazz",
        abbv: "jazz",
        desc: "Jazz bands per 1m people",
        toFixed: 3,
      },
    },
    electro: {
      updateGlobal: () => {
        rendering.genre = "metal";
        //rendering.interp = "interpolateGreens";
      },
      formula: (dProp) => {
        //rendering.genre = "electro";
        //rendering.interp = "interpolateGreens";
        //console.log(rendering.genre, rendering.time, rendering.interp);
        let nm = dProp.name.toLowerCase();
        if (data[nm].data[rendering.genre][rendering.time]["population"] == 0) {
          return 0;
        } else {
          let val =
            (Number(data[nm].data[rendering.genre][rendering.time]["count"]) /
              (Number(
                data[nm].data[rendering.genre][rendering.time]["population"]
              ) /
                1000000)) *
            10;
          return val;
        }
      },
      dataDefault: 0,
      // style: {
      //   paint: d3
      //     .scalePow()
      //     .interpolate(() => d3[rendering.interp])
      //     .exponent(0.15)
      //     .domain([-1, 50]),
      //   interpolation: d3[rendering.interp]
      // },
      properties: {
        title: "Electronic, Dubstep, EDM, Synth",
        abbv: "electronic",
        desc: "Electro bands per 1m people",
        toFixed: 3,
      },
    },
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
  }

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
  }

  // Fire the first render
  document.querySelector('label[for="rock"]').click();
};

document.body.addEventListener("mousemove", (e) => {
  d3.select("html").style("background-position-x", +e.offsetX / 10.0 + "px");
  d3.select("html").style("background-position-y", +e.offsetY / 10.0 + "px");
});

fetch(rawData)
  .then((res) => res.json())
  .then(processRaw);
