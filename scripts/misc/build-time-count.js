/**
 * Created by kfu on 7/2/16.
 */

/* eslint-disable */

// Run this script in the browser on the circle ci page
// This script calculates the number of build minutes
// shown for builds on a circle ci build page

var runningTotal = 0;
var builds = document.getElementsByClassName('container-fluid')[0];
var currentPage = 0;

function nextIteration() {
  builds.childNodes.forEach(build => {
    const metadata = build.getElementsByClassName('metadata')[0];
  const rowTiming = metadata.getElementsByClassName('timing')[0];
  const duration = rowTiming.getElementsByClassName('duration')[0];
  const span = duration.getElementsByTagName('span')[0];
  if (/^[0-9]{2}:[0-9]{2}$/.test(span.innerText)) {
    var minSec = span.innerText.split(':');
    var minutes = parseInt(minSec[0]);
    var seconds = parseInt(minSec[1]);
    runningTotal += minutes * 60;
    runningTotal += seconds;
  } else {
    // console.log('Failed to match regex');
  }
});
  console.log('Minutes: ', runningTotal / 60);
}

nextIteration();