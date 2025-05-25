// simpleFrameCounter.jsx
function sfc_countStart() {
  var comp = app.project.activeItem;
  if (comp instanceof CompItem) {
    $.global.sfc_startTime = comp.time;
    var startF = Math.floor($.global.sfc_startTime * comp.frameRate);
    return "Start frame: " + startF + "\nEnd frame: --\nTotal: --";
  }
  return "Please open a composition.";
}

function sfc_countEnd() {
  var comp = app.project.activeItem;
  if (comp instanceof CompItem && $.global.sfc_startTime != null) {
    var endTime   = comp.time;
    var frameRate = comp.frameRate;
    var startF    = Math.floor($.global.sfc_startTime * frameRate);
    var endF      = Math.floor(endTime * frameRate);
    var diffF     = endF - startF;
    var diffT     = (endTime - $.global.sfc_startTime).toFixed(2);
    return (
      "Start frame: " + startF +
      "\nEnd frame:   " + endF +
      "\nTotal:       " + diffF + " frames / " + diffT + " sec"
    );
  }
  return "Please press 'Count Start' first.";
}
