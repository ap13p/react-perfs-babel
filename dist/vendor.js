'use strict';

/**
 * @author mrdoob / http://mrdoob.com/
 * @author jetienne / http://jetienne.com/
 * @author paulirish / http://paulirish.com/
 */
var MemoryStats = function MemoryStats() {

	var msMin = 100;
	var msMax = 0;

	var container = document.createElement('div');
	container.id = 'stats';
	container.style.cssText = 'width:80px;opacity:0.9;cursor:pointer';

	var msDiv = document.createElement('div');
	msDiv.id = 'ms';
	msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020;';
	container.appendChild(msDiv);

	var msText = document.createElement('div');
	msText.id = 'msText';
	msText.style.cssText = 'color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
	msText.innerHTML = 'Memory';
	msDiv.appendChild(msText);

	var msGraph = document.createElement('div');
	msGraph.id = 'msGraph';
	msGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0f0';
	msDiv.appendChild(msGraph);

	while (msGraph.children.length < 74) {

		var bar = document.createElement('span');
		bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#131';
		msGraph.appendChild(bar);
	}

	var updateGraph = function updateGraph(dom, height, color) {

		var child = dom.appendChild(dom.firstChild);
		child.style.height = height + 'px';
		if (color) child.style.backgroundColor = color;
	};

	var perf = window.performance || {};
	// polyfill usedJSHeapSize
	if (!perf && !perf.memory) {
		perf.memory = { usedJSHeapSize: 0 };
	}
	if (perf && !perf.memory) {
		perf.memory = { usedJSHeapSize: 0 };
	}

	// support of the API?
	if (perf.memory.totalJSHeapSize === 0) {
		console.warn('totalJSHeapSize === 0... performance.memory is only available in Chrome .');
	}

	// TODO, add a sanity check to see if values are bucketed.
	// If so, reminde user to adopt the --enable-precise-memory-info flag.
	// open -a "/Applications/Google Chrome.app" --args --enable-precise-memory-info

	var lastTime = Date.now();
	var lastUsedHeap = perf.memory.usedJSHeapSize;
	return {
		domElement: container,

		update: function update() {

			// refresh only 30time per second
			if (Date.now() - lastTime < 1000 / 30) return;
			lastTime = Date.now();

			var delta = perf.memory.usedJSHeapSize - lastUsedHeap;
			lastUsedHeap = perf.memory.usedJSHeapSize;
			var color = delta < 0 ? '#830' : '#131';

			var ms = perf.memory.usedJSHeapSize;
			msMin = Math.min(msMin, ms);
			msMax = Math.max(msMax, ms);
			msText.textContent = "Mem: " + bytesToSize(ms, 2);

			var normValue = ms / (30 * 1024 * 1024);
			var height = Math.min(30, 30 - normValue * 30);
			updateGraph(msGraph, height, color);

			function bytesToSize(bytes, nFractDigit) {
				var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
				if (bytes == 0) return 'n/a';
				nFractDigit = nFractDigit !== undefined ? nFractDigit : 0;
				var precision = Math.pow(10, nFractDigit);
				var i = Math.floor(Math.log(bytes) / Math.log(1024));
				return Math.round(bytes * precision / Math.pow(1024, i)) / precision + ' ' + sizes[i];
			};
		}

	};
};'use strict';

var Monitoring = Monitoring || function () {

  var stats = new MemoryStats();
  stats.domElement.style.position = 'fixed';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '0px';
  document.body.appendChild(stats.domElement);
  requestAnimationFrame(function rAFloop() {
    stats.update();
    requestAnimationFrame(rAFloop);
  });

  var RenderRate = function RenderRate() {
    var container = document.createElement('div');
    container.id = 'stats';
    container.style.cssText = 'width:150px;opacity:0.9;cursor:pointer;position:fixed;right:80px;bottom:0px;';

    var msDiv = document.createElement('div');
    msDiv.id = 'ms';
    msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020;';
    container.appendChild(msDiv);

    var msText = document.createElement('div');
    msText.id = 'msText';
    msText.style.cssText = 'color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
    msText.innerHTML = 'Repaint rate: 0/sec';
    msDiv.appendChild(msText);

    var bucketSize = 20;
    var bucket = [];
    var lastTime = Date.now();
    return {
      domElement: container,
      ping: function ping() {
        var start = lastTime;
        var stop = Date.now();
        var rate = 1000 / (stop - start);
        bucket.push(rate);
        if (bucket.length > bucketSize) {
          bucket.shift();
        }
        var sum = 0;
        for (var i = 0; i < bucket.length; i++) {
          sum = sum + bucket[i];
        }
        msText.textContent = "Repaint rate: " + (sum / bucket.length).toFixed(2) + "/sec";
        lastTime = stop;
      }
    };
  };

  var renderRate = new RenderRate();
  document.body.appendChild(renderRate.domElement);

  return {
    memoryStats: stats,
    renderRate: renderRate
  };
}();'use strict';

var ENV = ENV || function () {

  var first = true;
  var counter = 0;
  var data;
  var _base;
  (_base = String.prototype).lpad || (_base.lpad = function (padding, toLength) {
    return padding.repeat((toLength - this.length) / padding.length).concat(this);
  });

  function formatElapsed(value) {
    var str = parseFloat(value).toFixed(2);
    if (value > 60) {
      minutes = Math.floor(value / 60);
      comps = (value % 60).toFixed(2).split('.');
      seconds = comps[0].lpad('0', 2);
      ms = comps[1];
      str = minutes + ":" + seconds + "." + ms;
    }
    return str;
  }

  function getElapsedClassName(elapsed) {
    var className = 'Query elapsed';
    if (elapsed >= 10.0) {
      className += ' warn_long';
    } else if (elapsed >= 1.0) {
      className += ' warn';
    } else {
      className += ' short';
    }
    return className;
  }

  function countClassName(queries) {
    var countClassName = "label";
    if (queries >= 20) {
      countClassName += " label-important";
    } else if (queries >= 10) {
      countClassName += " label-warning";
    } else {
      countClassName += " label-success";
    }
    return countClassName;
  }

  function updateQuery(object) {
    if (!object) {
      object = {};
    }
    var elapsed = Math.random() * 15;
    object.elapsed = elapsed;
    object.formatElapsed = formatElapsed(elapsed);
    object.elapsedClassName = getElapsedClassName(elapsed);
    object.query = "SELECT blah FROM something";
    object.waiting = Math.random() < 0.5;
    if (Math.random() < 0.2) {
      object.query = "<IDLE> in transaction";
    }
    if (Math.random() < 0.1) {
      object.query = "vacuum";
    }
    return object;
  }

  function cleanQuery(value) {
    if (value) {
      value.formatElapsed = "";
      value.elapsedClassName = "";
      value.query = "";
      value.elapsed = null;
      value.waiting = null;
    } else {
      return {
        query: "***",
        formatElapsed: "",
        elapsedClassName: ""
      };
    }
  }

  function generateRow(object, keepIdentity, counter) {
    var nbQueries = Math.floor(Math.random() * 10 + 1);
    if (!object) {
      object = {};
    }
    object.lastMutationId = counter;
    object.nbQueries = nbQueries;
    if (!object.lastSample) {
      object.lastSample = {};
    }
    if (!object.lastSample.topFiveQueries) {
      object.lastSample.topFiveQueries = [];
    }
    if (keepIdentity) {
      // for Angular optimization
      if (!object.lastSample.queries) {
        object.lastSample.queries = [];
        for (var l = 0; l < 12; l++) {
          object.lastSample.queries[l] = cleanQuery();
        }
      }
      for (var j in object.lastSample.queries) {
        var value = object.lastSample.queries[j];
        if (j <= nbQueries) {
          updateQuery(value);
        } else {
          cleanQuery(value);
        }
      }
    } else {
      object.lastSample.queries = [];
      for (var j = 0; j < 12; j++) {
        if (j < nbQueries) {
          var value = updateQuery(cleanQuery());
          object.lastSample.queries.push(value);
        } else {
          object.lastSample.queries.push(cleanQuery());
        }
      }
    }
    for (var i = 0; i < 5; i++) {
      var source = object.lastSample.queries[i];
      object.lastSample.topFiveQueries[i] = source;
    }
    object.lastSample.nbQueries = nbQueries;
    object.lastSample.countClassName = countClassName(nbQueries);
    return object;
  }

  function getData(keepIdentity) {
    var oldData = data;
    if (!keepIdentity) {
      // reset for each tick when !keepIdentity
      data = [];
      for (var i = 1; i <= ENV.rows; i++) {
        data.push({ dbname: 'cluster' + i, query: "", formatElapsed: "", elapsedClassName: "" });
        data.push({ dbname: 'cluster' + i + ' slave', query: "", formatElapsed: "", elapsedClassName: "" });
      }
    }
    if (!data) {
      // first init when keepIdentity
      data = [];
      for (var i = 1; i <= ENV.rows; i++) {
        data.push({ dbname: 'cluster' + i });
        data.push({ dbname: 'cluster' + i + ' slave' });
      }
      oldData = data;
    }
    for (var i in data) {
      var row = data[i];
      if (!keepIdentity && oldData && oldData[i]) {
        row.lastSample = oldData[i].lastSample;
      }
      if (!row.lastSample || Math.random() < ENV.mutations()) {
        counter = counter + 1;
        if (!keepIdentity) {
          row.lastSample = null;
        }
        generateRow(row, keepIdentity, counter);
      } else {
        data[i] = oldData[i];
      }
    }
    first = false;
    return {
      toArray: function toArray() {
        return data;
      }
    };
  }

  var mutationsValue = 0.5;

  function mutations(value) {
    if (value) {
      mutationsValue = value;
      return mutationsValue;
    } else {
      return mutationsValue;
    }
  }

  var body = document.querySelector('body');
  var theFirstChild = body.firstChild;

  var sliderContainer = document.createElement('div');
  sliderContainer.style.cssText = "display: flex";
  var slider = document.createElement('input');
  var text = document.createElement('label');
  text.innerHTML = 'mutations : ' + (mutationsValue * 100).toFixed(0) + '%';
  text.id = "ratioval";
  slider.setAttribute("type", "range");
  slider.style.cssText = 'margin-bottom: 10px; margin-top: 5px';
  slider.addEventListener('change', function (e) {
    ENV.mutations(e.target.value / 100);
    document.querySelector('#ratioval').innerHTML = 'mutations : ' + (ENV.mutations() * 100).toFixed(0) + '%';
  });
  sliderContainer.appendChild(text);
  sliderContainer.appendChild(slider);
  body.insertBefore(sliderContainer, theFirstChild);

  return {
    generateData: getData,
    rows: 50,
    timeout: 0,
    mutations: mutations
  };
}();

// Added to be easy change rows
var qs = function (a) {
  if (a == "") return {};
  var b = {};
  for (var i = 0; i < a.length; ++i) {
    var p = a[i].split('=', 2);
    if (p.length == 1) b[p[0]] = "";else b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
  }
  return b;
}(window.location.search.substr(1).split('&'));